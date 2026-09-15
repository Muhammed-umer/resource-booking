import "server-only";

import { and, desc, eq, gt, gte, inArray, lt, lte } from "drizzle-orm";

import { FACILITY_LABELS, type SessionUser } from "@/lib/auth/policy";
import { db } from "@/lib/db";
import {
  bookings,
  guestHouseBookings,
  type Booking,
  type FacilityType,
  type GuestHouseBooking,
} from "@/lib/db/schema";
import type {
  CreateBookingInput,
  CreateGuestHouseBookingInput,
} from "@/lib/validation";

/**
 * Raised when a request overlaps an existing one. The message names the
 * blocking booking, exactly like the Spring services did — the frontend shows
 * it verbatim, so it is part of the contract.
 */
export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Raised when a booking is not in the state an action needs (e.g. cancelling one that was never approved). */
export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateError";
  }
}

/** Statuses that occupy a slot on the calendar. Rejected and cancelled rows never do. */
const LIVE_STATUSES = ["APPROVED", "PENDING"] as const;

/* ------------------------------------------------------------------ *
 * Seminar hall / auditorium
 * ------------------------------------------------------------------ */

/**
 * Overlap check ported from BookingRepository.findConflicts: the date ranges
 * must overlap AND the time windows must overlap, and only APPROVED bookings
 * block a slot — pending requests never block each other.
 */
export async function findBookingConflicts(
  input: Pick<
    CreateBookingInput,
    "facilityType" | "fromDate" | "toDate" | "startTime" | "endTime"
  >,
): Promise<Booking[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.facilityType, input.facilityType),
        eq(bookings.bookingStatus, "APPROVED"),
        lte(bookings.fromDate, input.toDate),
        gte(bookings.toDate, input.fromDate),
        lt(bookings.startTime, input.endTime),
        gt(bookings.endTime, input.startTime),
      ),
    );
}

export async function createBooking(
  input: CreateBookingInput,
  user: SessionUser,
): Promise<Booking> {
  const conflicts = await findBookingConflicts(input);

  if (conflicts.length > 0) {
    const blocker = conflicts[0];
    throw new BookingConflictError(
      `Already booked by ${blocker.department} for '${blocker.eventName}'`,
    );
  }

  const [created] = await db
    .insert(bookings)
    .values({
      facilityType: input.facilityType,
      eventName: input.eventName,
      department: input.department,
      fromDate: input.fromDate,
      toDate: input.toDate,
      startTime: input.startTime,
      endTime: input.endTime,
      bookingStatus: "PENDING",
      requestedBy: user.userId,
      requestedByName: user.name,
    })
    .returning();

  return created;
}

export async function getAllBookings(): Promise<Booking[]> {
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingsByFacility(
  facilityType: FacilityType,
): Promise<Booking[]> {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.facilityType, facilityType))
    .orderBy(desc(bookings.createdAt));
}

/** The pending queue an admin sees, limited to the facilities they own. */
export async function getPendingBookings(
  facilities: readonly FacilityType[],
): Promise<Booking[]> {
  const hallFacilities = facilities.filter((f) => f !== "GUEST_HOUSE");
  if (hallFacilities.length === 0) return [];

  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingStatus, "PENDING"),
        inArray(bookings.facilityType, hallFacilities),
      ),
    )
    .orderBy(bookings.fromDate, bookings.startTime);
}

export async function getBookingsForUser(userId: string): Promise<Booking[]> {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.requestedBy, userId))
    .orderBy(desc(bookings.createdAt));
}

async function decideBooking(
  bookingId: number,
  facilityType: FacilityType,
  status: "APPROVED" | "REJECTED",
  admin: SessionUser,
  adminMessage?: string,
): Promise<Booking> {
  const [updated] = await db
    .update(bookings)
    .set({
      bookingStatus: status,
      adminMessage: adminMessage ?? null,
      decidedBy: admin.name,
      decidedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.bookingId, bookingId),
        // Re-check the facility in the WHERE clause so an id from another
        // facility can never be decided by the wrong admin.
        eq(bookings.facilityType, facilityType),
      ),
    )
    .returning();

  if (!updated) {
    throw new NotFoundError(
      `No ${FACILITY_LABELS[facilityType]} booking found with id ${bookingId}.`,
    );
  }

  return updated;
}

export function approveBooking(
  bookingId: number,
  facilityType: FacilityType,
  admin: SessionUser,
  adminMessage?: string,
): Promise<Booking> {
  return decideBooking(bookingId, facilityType, "APPROVED", admin, adminMessage);
}

export function rejectBooking(
  bookingId: number,
  facilityType: FacilityType,
  admin: SessionUser,
  adminMessage?: string,
): Promise<Booking> {
  return decideBooking(bookingId, facilityType, "REJECTED", admin, adminMessage);
}

/**
 * Withdraw an approved booking. Only APPROVED rows can be cancelled — a pending
 * request is rejected instead — and the slot becomes free again immediately.
 * The optional reason is stored as the admin note the requester sees.
 */
export async function cancelBooking(
  bookingId: number,
  facilityType: FacilityType,
  admin: SessionUser,
  reason?: string,
): Promise<Booking> {
  const [updated] = await db
    .update(bookings)
    .set({
      bookingStatus: "CANCELLED",
      adminMessage: reason ?? null,
      decidedBy: admin.name,
      decidedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.bookingId, bookingId),
        eq(bookings.facilityType, facilityType),
        eq(bookings.bookingStatus, "APPROVED"),
      ),
    )
    .returning();

  if (updated) return updated;

  const [existing] = await db
    .select({ status: bookings.bookingStatus })
    .from(bookings)
    .where(and(eq(bookings.bookingId, bookingId), eq(bookings.facilityType, facilityType)));

  if (!existing) {
    throw new NotFoundError(
      `No ${FACILITY_LABELS[facilityType]} booking found with id ${bookingId}.`,
    );
  }
  throw new InvalidStateError(
    `Booking #${bookingId} is ${existing.status.toLowerCase()}, only approved bookings can be cancelled.`,
  );
}

/* ------------------------------------------------------------------ *
 * Guest house
 * ------------------------------------------------------------------ */

/**
 * Room-level overlap check ported from GuestHouseRepository. Dates only — the
 * guest house has no time-of-day component.
 *
 * Deviation from the Java: rejected and cancelled stays are excluded. In the
 * original, any existing row blocked the room forever, so a rejected booking
 * permanently locked out the dates.
 */
export async function findGuestHouseConflicts(
  input: Pick<CreateGuestHouseBookingInput, "roomNumber" | "fromDate" | "toDate">,
): Promise<GuestHouseBooking[]> {
  return db
    .select()
    .from(guestHouseBookings)
    .where(
      and(
        eq(guestHouseBookings.roomNumber, input.roomNumber),
        inArray(guestHouseBookings.status, LIVE_STATUSES),
        lte(guestHouseBookings.fromDate, input.toDate),
        gte(guestHouseBookings.toDate, input.fromDate),
      ),
    );
}

export async function createGuestHouseBooking(
  input: CreateGuestHouseBookingInput,
  user: SessionUser,
): Promise<GuestHouseBooking> {
  const conflicts = await findGuestHouseConflicts(input);

  if (conflicts.length > 0) {
    const blocker = conflicts[0];
    throw new BookingConflictError(
      `Room ${input.roomNumber} is already booked by ${blocker.guestName} (Purpose: ${blocker.purpose ?? "not given"})`,
    );
  }

  const [created] = await db
    .insert(guestHouseBookings)
    .values({
      guestName: input.guestName,
      phoneNumber: input.phoneNumber,
      purpose: input.purpose ?? null,
      fromDate: input.fromDate,
      toDate: input.toDate,
      checkInTime: input.checkInTime ?? null,
      checkOutTime: input.checkOutTime ?? null,
      roomNumber: input.roomNumber,
      status: "PENDING",
      requestedBy: user.userId,
      requestedByName: user.name,
    })
    .returning();

  return created;
}

export async function getAllGuestHouseBookings(): Promise<GuestHouseBooking[]> {
  return db
    .select()
    .from(guestHouseBookings)
    .orderBy(desc(guestHouseBookings.createdAt));
}

export async function getGuestHouseBookingById(
  bookingId: number,
): Promise<GuestHouseBooking> {
  const [found] = await db
    .select()
    .from(guestHouseBookings)
    .where(eq(guestHouseBookings.bookingId, bookingId));

  if (!found) {
    throw new NotFoundError(`Booking not found with ID: ${bookingId}`);
  }

  return found;
}

export async function getPendingGuestHouseBookings(): Promise<
  GuestHouseBooking[]
> {
  return db
    .select()
    .from(guestHouseBookings)
    .where(eq(guestHouseBookings.status, "PENDING"))
    .orderBy(guestHouseBookings.fromDate);
}

export async function getGuestHouseBookingsForUser(
  userId: string,
): Promise<GuestHouseBooking[]> {
  return db
    .select()
    .from(guestHouseBookings)
    .where(eq(guestHouseBookings.requestedBy, userId))
    .orderBy(desc(guestHouseBookings.createdAt));
}

async function decideGuestHouseBooking(
  bookingId: number,
  status: "APPROVED" | "REJECTED",
  admin: SessionUser,
  adminMessage?: string,
): Promise<GuestHouseBooking> {
  const [updated] = await db
    .update(guestHouseBookings)
    .set({
      status,
      adminMessage: adminMessage ?? null,
      decidedBy: admin.name,
      decidedAt: new Date(),
    })
    .where(eq(guestHouseBookings.bookingId, bookingId))
    .returning();

  if (!updated) {
    throw new NotFoundError(`Booking not found with ID: ${bookingId}`);
  }

  return updated;
}

export function approveGuestHouseBooking(
  bookingId: number,
  admin: SessionUser,
  adminMessage?: string,
): Promise<GuestHouseBooking> {
  return decideGuestHouseBooking(bookingId, "APPROVED", admin, adminMessage);
}

export function rejectGuestHouseBooking(
  bookingId: number,
  admin: SessionUser,
  adminMessage?: string,
): Promise<GuestHouseBooking> {
  return decideGuestHouseBooking(bookingId, "REJECTED", admin, adminMessage);
}

/** Withdraw an approved stay; see cancelBooking. */
export async function cancelGuestHouseBooking(
  bookingId: number,
  admin: SessionUser,
  reason?: string,
): Promise<GuestHouseBooking> {
  const [updated] = await db
    .update(guestHouseBookings)
    .set({
      status: "CANCELLED",
      adminMessage: reason ?? null,
      decidedBy: admin.name,
      decidedAt: new Date(),
    })
    .where(
      and(
        eq(guestHouseBookings.bookingId, bookingId),
        eq(guestHouseBookings.status, "APPROVED"),
      ),
    )
    .returning();

  if (updated) return updated;

  const existing = await getGuestHouseBookingById(bookingId);
  throw new InvalidStateError(
    `Booking #${bookingId} is ${existing.status.toLowerCase()}, only approved stays can be cancelled.`,
  );
}

/* ------------------------------------------------------------------ *
 * Calendar
 * ------------------------------------------------------------------ */

export type DayStatus = "BOOKED" | "PENDING" | "AVAILABLE";

/**
 * One facility on one day, split at noon. `status` is the worst of the two
 * halves, so a day with a morning booking reads BOOKED overall while its
 * afternoon still reads AVAILABLE.
 */
export type FacilityDay = {
  status: DayStatus;
  morning: DayStatus;
  afternoon: DayStatus;
};

/**
 * One booking as it appears on a calendar day — enough to answer "who has it,
 * when, and is it confirmed?" without exposing contact details.
 */
export type CalendarEntry = {
  id: number;
  facilityType: FacilityType;
  status: "BOOKED" | "PENDING";
  /** Event name for halls, "Room N · guest" for the guest house. */
  title: string;
  /** Department for halls, purpose for the guest house. */
  detail: string;
  fromDate: string;
  toDate: string;
  startTime: string | null;
  endTime: string | null;
  requestedByName: string;
};

export type CalendarDayStatus = {
  date: string;
  /** Flat per-facility status — the original CalendarDayStatusDTO shape. */
  seminarHallStatus: DayStatus;
  auditoriumStatus: DayStatus;
  guestHouseStatus: DayStatus;
  /** Half-day detail behind those statuses. */
  seminarHall: FacilityDay;
  auditorium: FacilityDay;
  guestHouse: FacilityDay;
  /** The bookings behind those statuses, halls first, then by start time. */
  entries: CalendarEntry[];
};

const NOON = "12:00:00";

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

function escalate(current: DayStatus, incoming: DayStatus): DayStatus {
  if (current === "BOOKED" || incoming === "BOOKED") return "BOOKED";
  if (current === "PENDING" || incoming === "PENDING") return "PENDING";
  return "AVAILABLE";
}

function emptyFacilityDay(): FacilityDay {
  return { status: "AVAILABLE", morning: "AVAILABLE", afternoon: "AVAILABLE" };
}

function mark(
  day: FacilityDay,
  status: DayStatus,
  morning: boolean,
  afternoon: boolean,
) {
  if (morning) day.morning = escalate(day.morning, status);
  if (afternoon) day.afternoon = escalate(day.afternoon, status);
  day.status = escalate(day.morning, day.afternoon);
}

/**
 * Per-day availability for the whole range, ported from CalendarService and
 * extended with morning/afternoon coverage.
 *
 * A hall booking's time window applies on each day of its date range: it
 * covers the morning if it starts before noon and the afternoon if it ends
 * after noon. Guest house stays have no time window and cover the whole day.
 *
 * Deviations from the Java: guest house status comes from the guest house
 * table (the original looked for GUEST_HOUSE rows in the bookings table, which
 * never exist), pending requests read PENDING rather than fully booked, and
 * cancelled bookings are ignored like rejected ones.
 */
export async function getCalendarStatus(
  startDate: string,
  endDate: string,
): Promise<CalendarDayStatus[]> {
  const [hallRows, guestRows] = await Promise.all([
    db
      .select({
        bookingId: bookings.bookingId,
        facilityType: bookings.facilityType,
        eventName: bookings.eventName,
        department: bookings.department,
        fromDate: bookings.fromDate,
        toDate: bookings.toDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        bookingStatus: bookings.bookingStatus,
        requestedByName: bookings.requestedByName,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.bookingStatus, LIVE_STATUSES),
          lte(bookings.fromDate, endDate),
          gte(bookings.toDate, startDate),
        ),
      ),
    db
      .select({
        bookingId: guestHouseBookings.bookingId,
        roomNumber: guestHouseBookings.roomNumber,
        guestName: guestHouseBookings.guestName,
        purpose: guestHouseBookings.purpose,
        fromDate: guestHouseBookings.fromDate,
        toDate: guestHouseBookings.toDate,
        checkInTime: guestHouseBookings.checkInTime,
        checkOutTime: guestHouseBookings.checkOutTime,
        status: guestHouseBookings.status,
        requestedByName: guestHouseBookings.requestedByName,
      })
      .from(guestHouseBookings)
      .where(
        and(
          inArray(guestHouseBookings.status, LIVE_STATUSES),
          lte(guestHouseBookings.fromDate, endDate),
          gte(guestHouseBookings.toDate, startDate),
        ),
      ),
  ]);

  return eachDate(startDate, endDate).map((date) => {
    const seminarHall = emptyFacilityDay();
    const auditorium = emptyFacilityDay();
    const guestHouse = emptyFacilityDay();
    const entries: CalendarEntry[] = [];

    for (const row of hallRows) {
      if (row.fromDate > date || row.toDate < date) continue;

      const status: DayStatus =
        row.bookingStatus === "APPROVED" ? "BOOKED" : "PENDING";
      const coversMorning = row.startTime < NOON;
      const coversAfternoon = row.endTime > NOON;

      const target =
        row.facilityType === "SEMINAR_HALL"
          ? seminarHall
          : row.facilityType === "AUDITORIUM"
            ? auditorium
            : guestHouse;

      mark(target, status, coversMorning, coversAfternoon);
      entries.push({
        id: row.bookingId,
        facilityType: row.facilityType,
        status,
        title: row.eventName,
        detail: row.department,
        fromDate: row.fromDate,
        toDate: row.toDate,
        startTime: row.startTime,
        endTime: row.endTime,
        requestedByName: row.requestedByName,
      });
    }

    for (const row of guestRows) {
      if (row.fromDate > date || row.toDate < date) continue;
      const status = row.status === "APPROVED" ? "BOOKED" : "PENDING";
      mark(guestHouse, status, true, true);
      entries.push({
        id: row.bookingId,
        facilityType: "GUEST_HOUSE",
        status,
        title: `Room ${row.roomNumber} · ${row.guestName}`,
        detail: row.purpose ?? "No purpose given",
        fromDate: row.fromDate,
        toDate: row.toDate,
        startTime: row.checkInTime,
        endTime: row.checkOutTime,
        requestedByName: row.requestedByName,
      });
    }

    entries.sort((a, b) => {
      if (a.facilityType !== b.facilityType) {
        return a.facilityType === "GUEST_HOUSE" ? 1 : b.facilityType === "GUEST_HOUSE" ? -1 : a.facilityType.localeCompare(b.facilityType);
      }
      return (a.startTime ?? "").localeCompare(b.startTime ?? "");
    });

    return {
      date,
      seminarHallStatus: seminarHall.status,
      auditoriumStatus: auditorium.status,
      guestHouseStatus: guestHouse.status,
      seminarHall,
      auditorium,
      guestHouse,
      entries,
    };
  });
}
