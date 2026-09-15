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

/** Seminar hall / auditorium request — mirrors the Booking entity's fields. */
export const createBookingSchema = z
  .object({
    facilityType: z.enum(["SEMINAR_HALL", "AUDITORIUM"]),
    eventName: z.string().trim().min(1, "Event name is required.").max(200),
    department: departmentSchema,
    fromDate: dateString,
    toDate: dateString,
    startTime: timeString,
    endTime: timeString,
  })
  .refine((data) => data.fromDate >= todayISO(), {
    message: PAST_DATE_MESSAGE,
    path: ["fromDate"],
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: "The end date cannot be before the start date.",
    path: ["toDate"],
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "The end time must be after the start time.",
    path: ["endTime"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

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
