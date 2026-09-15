import { z } from "zod";

import {
  bookingStatusEnum,
  departmentEnum,
  facilityTypeEnum,
} from "@/lib/db/schema";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const dateString = z
  .string()
  .regex(DATE_RE, "Use a date in YYYY-MM-DD format.");

const timeString = z
  .string()
  .regex(TIME_RE, "Use a time in HH:MM format.")
  .transform((value) => (value.length === 5 ? `${value}:00` : value));

/** Today's date in the server's local timezone, as YYYY-MM-DD. */
export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const PAST_DATE_MESSAGE = "That date has already passed. Pick today or a later date.";

export const facilityTypeSchema = z.enum(facilityTypeEnum.enumValues);
export const bookingStatusSchema = z.enum(bookingStatusEnum.enumValues);
export const departmentSchema = z.enum(departmentEnum.enumValues);

function eachDate(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** One day of a hall request with that day's hours. */
export const slotSchema = z
  .object({
    date: dateString,
    startTime: timeString,
    endTime: timeString,
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: "The end time must be after the start time.",
    path: ["endTime"],
  });

export type SlotInput = z.infer<typeof slotSchema>;

/**
 * Seminar hall / auditorium request.
 *
 * Two accepted shapes:
 *   - `slots`: one entry per day, each with its own hours (the booking form).
 *   - `fromDate` + `toDate` + `startTime` + `endTime`: the same hours on every
 *     day of the range (the original API shape). Expanded into slots.
 *
 * The output always carries `slots` (sorted, unique dates) plus the summary
 * fields `fromDate`/`toDate` (first and last day) and `startTime`/`endTime`
 * (first day's hours) that the `bookings` row stores.
 */
export const createBookingSchema = z
  .object({
    facilityType: z.enum(["SEMINAR_HALL", "AUDITORIUM"]),
    eventName: z.string().trim().min(1, "Event name is required.").max(200),
    department: departmentSchema,
    fromDate: dateString.optional(),
    toDate: dateString.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    slots: z.array(slotSchema).max(31, "A single request can cover at most 31 days.").optional(),
  })
  .transform((data, ctx) => {
    let slots = data.slots ?? [];

    if (slots.length === 0) {
      const { fromDate, toDate, startTime, endTime } = data;
      if (!fromDate || !toDate || !startTime || !endTime) {
        ctx.addIssue({
          code: "custom",
          message: "Pick at least one day with a start and end time.",
          path: ["slots"],
        });
        return z.NEVER;
      }
      if (fromDate > toDate) {
        ctx.addIssue({
          code: "custom",
          message: "The end date cannot be before the start date.",
          path: ["toDate"],
        });
        return z.NEVER;
      }
      if (startTime >= endTime) {
        ctx.addIssue({
          code: "custom",
          message: "The end time must be after the start time.",
          path: ["endTime"],
        });
        return z.NEVER;
      }
      if (eachDate(fromDate, toDate).length > 31) {
        ctx.addIssue({
          code: "custom",
          message: "A single request can cover at most 31 days.",
          path: ["toDate"],
        });
        return z.NEVER;
      }
      slots = eachDate(fromDate, toDate).map((date) => ({ date, startTime, endTime }));
    }

    slots = [...slots].sort((a, b) => a.date.localeCompare(b.date));

    const today = todayISO();
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].date < today) {
        ctx.addIssue({ code: "custom", message: PAST_DATE_MESSAGE, path: ["slots", i, "date"] });
        return z.NEVER;
      }
      if (i > 0 && slots[i].date === slots[i - 1].date) {
        ctx.addIssue({
          code: "custom",
          message: "The same day is listed twice. Give each day one time window.",
          path: ["slots", i, "date"],
        });
        return z.NEVER;
      }
    }

    const first = slots[0];
    const last = slots[slots.length - 1];
    return {
      facilityType: data.facilityType,
      eventName: data.eventName,
      department: data.department,
      slots,
      fromDate: first.date,
      toDate: last.date,
      startTime: first.startTime,
      endTime: first.endTime,
    };
  });

/** What the schema accepts (either shape). */
export type CreateBookingRequest = z.input<typeof createBookingSchema>;
/** What the schema produces: always with `slots`. */
export type CreateBookingInput = z.output<typeof createBookingSchema>;

/** Guest house stay — mirrors the GuestHouse entity's fields. */
export const createGuestHouseBookingSchema = z
  .object({
    guestName: z.string().trim().min(1, "Guest name is required.").max(200),
    phoneNumber: z
      .string()
      .trim()
      .min(6, "Enter a reachable phone number.")
      .max(20),
    purpose: z.string().trim().max(500).optional(),
    fromDate: dateString,
    toDate: dateString,
    checkInTime: timeString.optional(),
    checkOutTime: timeString.optional(),
    roomNumber: z.coerce
      .number()
      .int("Room number must be a whole number.")
      .min(1, "Room number must be 1 or higher."),
  })
  .refine((data) => data.fromDate >= todayISO(), {
    message: PAST_DATE_MESSAGE,
    path: ["fromDate"],
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: "The check-out date cannot be before the check-in date.",
    path: ["toDate"],
  });

export type CreateGuestHouseBookingInput = z.infer<
  typeof createGuestHouseBookingSchema
>;

export const decisionSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  facilityType: facilityTypeSchema,
  adminMessage: z.string().trim().max(500).optional(),
});

export const calendarRangeSchema = z
  .object({
    startDate: dateString,
    endDate: dateString,
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "endDate must be on or after startDate.",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const start = Date.parse(data.startDate);
      const end = Date.parse(data.endDate);
      return (end - start) / 86_400_000 <= 366;
    },
    { message: "Ask for at most one year of calendar data at a time." },
  );

/** Flattens a ZodError into "field: message" lines for the status modal. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(" ");
}
