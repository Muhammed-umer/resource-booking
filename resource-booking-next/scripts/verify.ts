/**
 * End-to-end check of the business logic and the login machinery against a
 * real Postgres.
 *
 *   npm run verify
 *
 * Exercises password hashing, session tokens, conflict detection, the approval
 * flow and the calendar directly through the service layer — no browser needed.
 */
import { eq, sql } from "drizzle-orm";

import { canManageFacility, type SessionUser } from "../lib/auth/policy";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { createSessionToken, verifySessionToken } from "../lib/auth/session";
import { db } from "../lib/db";
import { bookings, bookingSlots, guestHouseBookings, users } from "../lib/db/schema";
import {
  approveBooking,
  approveGuestHouseBooking,
  BookingConflictError,
  cancelBooking,
  cancelGuestHouseBooking,
  createBooking,
  createGuestHouseBooking,
  getCalendarStatus,
  getPendingBookings,
  InvalidStateError,
  rejectGuestHouseBooking,
} from "../lib/bookings/service";
import { bookingToRow as bookingToRowForTest, countDays, formatDateRange, formatSchedule } from "../lib/bookings/view";
import {
  createBookingSchema,
  createGuestHouseBookingSchema,
} from "../lib/validation";

const STUDENT: SessionUser = {
  userId: "9001",
  email: "student@test.local",
  role: "USER",
  name: "Priya R (CSE)",
  department: "CSE",
};

const SEMINAR_ADMIN: SessionUser = {
  userId: "9002",
  email: "seminar@test.local",
  role: "ADMIN_SEMINAR",
  name: "Seminar Admin",
  department: null,
};

const RESOURCE_ADMIN: SessionUser = {
  userId: "9003",
  email: "resource@test.local",
  role: "ADMIN_RESOURCE",
  name: "Resource Admin",
  department: null,
};

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function expectConflict(
  label: string,
  run: () => Promise<unknown>,
  expectedFragment: string,
) {
  try {
    await run();
    check(label, false, "expected a conflict, none was thrown");
  } catch (error) {
    if (error instanceof BookingConflictError) {
      check(
        label,
        error.message.includes(expectedFragment),
        `message was "${error.message}"`,
      );
    } else {
      check(label, false, `threw ${String(error)}`);
    }
  }
}

function day(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function main() {
  // ------------------------------------------------------------ passwords
  console.log("\nPasswords");

  const hash = await hashPassword("password123");
  check("hash uses the scrypt format", hash.startsWith("scrypt:") && hash.split(":").length === 3);
  check("correct password verifies", await verifyPassword("password123", hash));
  check("wrong password is rejected", !(await verifyPassword("password124", hash)));
  check("garbage hash is rejected, not thrown", !(await verifyPassword("password123", "nonsense")));
  check(
    "two hashes of the same password differ (salted)",
    (await hashPassword("password123")) !== hash,
  );

  // ------------------------------------------------------------- sessions
  console.log("\nSession cookies");

  const token = await createSessionToken(42);
  const payload = await verifySessionToken(token);
  check("a fresh token verifies and carries the user id", payload?.sub === 42);
  check(
    "a tampered token is rejected",
    (await verifySessionToken(token.replace(/^(.)/, (c) => (c === "A" ? "B" : "A")))) === null,
  );
  check("a missing signature is rejected", (await verifySessionToken(token.split(".")[0])) === null);
  check("an expired token is rejected", (await verifySessionToken(await createSessionToken(42, -1))) === null);
  check("an empty cookie is rejected", (await verifySessionToken(undefined)) === null);

  // ---------------------------------------------------------------- halls
  console.log("\nResetting booking tables…");
  await db.execute(sql`TRUNCATE ${bookings}, ${bookingSlots}, ${guestHouseBookings} RESTART IDENTITY`);

  console.log("\nSeminar hall / auditorium bookings");

  const first = await createBooking(
    {
      facilityType: "SEMINAR_HALL",
      eventName: "Placement Training",
      department: "CSE",
      fromDate: day(5),
      toDate: day(5),
      startTime: "10:00:00",
      endTime: "13:00:00",
    },
    STUDENT,
  );
  check("create a hall booking", first.bookingId > 0);
  check("new bookings start as PENDING", first.bookingStatus === "PENDING");
  check("requester is recorded", first.requestedBy === STUDENT.userId);

  const overlapWhilePending = await createBooking(
    {
      facilityType: "SEMINAR_HALL",
      eventName: "Alumni Meet",
      department: "IT",
      fromDate: day(5),
      toDate: day(5),
      startTime: "11:00:00",
      endTime: "12:00:00",
    },
    STUDENT,
  );
  check(
    "a PENDING booking does not block an overlapping request",
    overlapWhilePending.bookingId > 0,
  );

  await approveBooking(first.bookingId, "SEMINAR_HALL", SEMINAR_ADMIN);

  await expectConflict(
    "an APPROVED booking blocks an overlapping request",
    () =>
      createBooking(
        {
          facilityType: "SEMINAR_HALL",
          eventName: "Guest Lecture",
          department: "ECE",
          fromDate: day(5),
          toDate: day(5),
          startTime: "12:00:00",
          endTime: "14:00:00",
        },
        STUDENT,
      ),
    "Already booked by CSE for 'Placement Training'",
  );

  const laterSameDay = await createBooking(
    {
      facilityType: "SEMINAR_HALL",
      eventName: "Evening Club",
      department: "EEE",
      fromDate: day(5),
      toDate: day(5),
      startTime: "13:00:00",
      endTime: "16:00:00",
    },
    STUDENT,
  );
  check("a non-overlapping time on the same day is allowed", laterSameDay.bookingId > 0);

  const otherFacility = await createBooking(
    {
      facilityType: "AUDITORIUM",
      eventName: "Annual Day",
      department: "MECHANICAL",
      fromDate: day(5),
      toDate: day(5),
      startTime: "10:00:00",
      endTime: "13:00:00",
    },
    STUDENT,
  );
  check("the same slot in a different facility is allowed", otherFacility.bookingId > 0);

  // ---------------------------------------------------------- guest house
  console.log("\nGuest house stays");

  const room2 = await createGuestHouseBooking(
    {
      guestName: "Prof. Meenakshi S",
      phoneNumber: "+91 98765 43210",
      purpose: "External examiner",
      fromDate: day(3),
      toDate: day(6),
      roomNumber: 2,
    },
    STUDENT,
  );
  check("create a guest house stay", room2.bookingId > 0);

  await expectConflict(
    "overlapping dates in the same room are blocked",
    () =>
      createGuestHouseBooking(
        {
          guestName: "Dr. Anand K",
          phoneNumber: "+91 90000 00000",
          fromDate: day(5),
          toDate: day(8),
          roomNumber: 2,
        },
        STUDENT,
      ),
    "Room 2 is already booked by Prof. Meenakshi S",
  );

  const room3 = await createGuestHouseBooking(
    {
      guestName: "Dr. Anand K",
      phoneNumber: "+91 90000 00000",
      fromDate: day(5),
      toDate: day(8),
      roomNumber: 3,
    },
    STUDENT,
  );
  check("the same dates in a different room are allowed", room3.bookingId > 0);

  await rejectGuestHouseBooking(room2.bookingId, RESOURCE_ADMIN);

  const afterRejection = await createGuestHouseBooking(
    {
      guestName: "Third Guest",
      phoneNumber: "+91 91111 11111",
      fromDate: day(3),
      toDate: day(6),
      roomNumber: 2,
    },
    STUDENT,
  );
  check("a REJECTED stay stops blocking the room (fix vs. the Java)", afterRejection.bookingId > 0);

  // -------------------------------------------------------------- queues
  console.log("\nAdmin queues and role scoping");

  const seminarQueue = await getPendingBookings(["SEMINAR_HALL"]);
  check(
    "seminar queue only holds pending seminar bookings",
    seminarQueue.length > 0 &&
      seminarQueue.every(
        (b) => b.facilityType === "SEMINAR_HALL" && b.bookingStatus === "PENDING",
      ),
    `got ${seminarQueue.length} rows`,
  );
  check(
    "the approved booking has left the queue",
    !seminarQueue.some((b) => b.bookingId === first.bookingId),
  );
  check("seminar admin may act on the seminar hall", canManageFacility("ADMIN_SEMINAR", "SEMINAR_HALL"));
  check("seminar admin may NOT act on the auditorium", !canManageFacility("ADMIN_SEMINAR", "AUDITORIUM"));
  check(
    "resource admin owns auditorium and guest house",
    canManageFacility("ADMIN_RESOURCE", "AUDITORIUM") &&
      canManageFacility("ADMIN_RESOURCE", "GUEST_HOUSE"),
  );
  check("a plain user owns nothing", !canManageFacility("USER", "SEMINAR_HALL"));

  // ------------------------------------------------------------ calendar
  console.log("\nCalendar");

  const days = await getCalendarStatus(day(0), day(10));
  check("one row per day in the range", days.length === 11, `got ${days.length}`);

  const bookedDay = days.find((d) => d.date === day(5));
  check("an approved seminar booking reads BOOKED", bookedDay?.seminarHallStatus === "BOOKED", `got ${bookedDay?.seminarHallStatus}`);
  check("a pending auditorium booking reads PENDING", bookedDay?.auditoriumStatus === "PENDING", `got ${bookedDay?.auditoriumStatus}`);

  const guestDay = days.find((d) => d.date === day(4));
  check(
    "guest house status comes from the guest house table (fix vs. the Java)",
    guestDay?.guestHouseStatus === "PENDING",
    `got ${guestDay?.guestHouseStatus}`,
  );

  const freeDay = days.find((d) => d.date === day(10));
  check(
    "an unbooked day reads AVAILABLE everywhere",
    freeDay?.seminarHallStatus === "AVAILABLE" &&
      freeDay?.auditoriumStatus === "AVAILABLE" &&
      freeDay?.guestHouseStatus === "AVAILABLE",
  );

  // Half-day coverage: the approved 10:00–13:00 seminar booking spans noon.
  check(
    "a booking spanning noon fills both halves",
    bookedDay?.seminarHall.morning === "BOOKED" &&
      bookedDay?.seminarHall.afternoon === "BOOKED",
    `got ${bookedDay?.seminarHall.morning}/${bookedDay?.seminarHall.afternoon}`,
  );

  const morningOnly = await createBooking(
    {
      facilityType: "AUDITORIUM",
      eventName: "Morning briefing",
      department: "CIVIL",
      fromDate: day(6),
      toDate: day(6),
      startTime: "08:00:00",
      endTime: "11:00:00",
    },
    STUDENT,
  );
  await approveBooking(morningOnly.bookingId, "AUDITORIUM", RESOURCE_ADMIN);
  const [halfDay] = await getCalendarStatus(day(6), day(6));
  check(
    "a morning-only booking fills the left half only",
    halfDay?.auditorium.morning === "BOOKED" &&
      halfDay?.auditorium.afternoon === "AVAILABLE" &&
      halfDay?.auditorium.status === "BOOKED",
    `got ${halfDay?.auditorium.morning}/${halfDay?.auditorium.afternoon}`,
  );

  const afternoonOnly = await createBooking(
    {
      facilityType: "AUDITORIUM",
      eventName: "Evening talk",
      department: "IT",
      fromDate: day(7),
      toDate: day(7),
      startTime: "12:00:00",
      endTime: "15:00:00",
    },
    STUDENT,
  );
  await approveBooking(afternoonOnly.bookingId, "AUDITORIUM", RESOURCE_ADMIN);
  const [afternoonDay] = await getCalendarStatus(day(7), day(7));
  check(
    "a booking from noon fills the right half only",
    afternoonDay?.auditorium.morning === "AVAILABLE" &&
      afternoonDay?.auditorium.afternoon === "BOOKED",
    `got ${afternoonDay?.auditorium.morning}/${afternoonDay?.auditorium.afternoon}`,
  );
  check(
    "a guest house stay covers the whole day",
    guestDay?.guestHouse.morning === "PENDING" && guestDay?.guestHouse.afternoon === "PENDING",
  );

  // Day details: the bookings behind each day, for the click-to-see panel.
  const morningEntry = halfDay?.entries.find((e) => e.id === morningOnly.bookingId);
  check(
    "a day lists the booking behind it with department, event and time",
    morningEntry?.facilityType === "AUDITORIUM" &&
      morningEntry.status === "BOOKED" &&
      morningEntry.detail === "CIVIL" &&
      morningEntry.title === "Morning briefing" &&
      morningEntry.startTime === "08:00:00" &&
      morningEntry.endTime === "11:00:00",
    JSON.stringify(morningEntry),
  );
  check(
    "a pending request is listed as PENDING, a guest stay names its room",
    bookedDay?.entries.some((e) => e.facilityType === "AUDITORIUM" && e.status === "PENDING") === true &&
      guestDay?.entries.some((e) => e.facilityType === "GUEST_HOUSE" && e.title.startsWith("Room ")) === true,
  );
  check("a free day lists no bookings", freeDay?.entries.length === 0, `got ${freeDay?.entries.length}`);

  // ----------------------------------------------------------- multi-day
  console.log("\nMulti-day bookings (same hours on each day)");

  const twoDay = await createBooking(
    {
      facilityType: "SEMINAR_HALL",
      eventName: "Placement drive",
      department: "CSE",
      fromDate: day(8),
      toDate: day(9),
      startTime: "10:00:00",
      endTime: "17:00:00",
    },
    STUDENT,
  );
  await approveBooking(twoDay.bookingId, "SEMINAR_HALL", SEMINAR_ADMIN);
  const multiDays = await getCalendarStatus(day(8), day(10));
  check(
    "both days of a 2-day booking are marked, the day after is free",
    multiDays[0]?.seminarHall.status === "BOOKED" &&
      multiDays[1]?.seminarHall.status === "BOOKED" &&
      multiDays[2]?.seminarHall.status === "AVAILABLE",
  );
  await expectConflict(
    "the second day's hours are blocked too",
    () =>
      createBooking(
        {
          facilityType: "SEMINAR_HALL",
          eventName: "Clash",
          department: "IT",
          fromDate: day(9),
          toDate: day(9),
          startTime: "15:00:00",
          endTime: "18:00:00",
        },
        STUDENT,
      ),
    "Already booked by CSE for 'Placement drive'",
  );
  const eveningOnDay2 = await createBooking(
    {
      facilityType: "SEMINAR_HALL",
      eventName: "Evening slot",
      department: "IT",
      fromDate: day(9),
      toDate: day(9),
      startTime: "17:00:00",
      endTime: "19:00:00",
    },
    STUDENT,
  );
  check("outside those hours on day 2 is still free (not held overnight)", eveningOnDay2.bookingId > 0);

  check("countDays is inclusive", countDays("2026-09-19", "2026-09-20") === 2 && countDays("2026-09-19", "2026-09-19") === 1);
  check(
    "date ranges compress within a month and across months",
    formatDateRange("2026-09-19", "2026-09-20") === "19 – 20 Sept 2026" &&
      formatDateRange("2026-09-28", "2026-10-02") === "28 Sept – 2 Oct 2026",
    `${formatDateRange("2026-09-19", "2026-09-20")} | ${formatDateRange("2026-09-28", "2026-10-02")}`,
  );
  const hallSchedule = formatSchedule({ facilityType: "AUDITORIUM", fromDate: "2026-09-19", toDate: "2026-09-20", startTime: "10:00:00", endTime: "17:00:00" });
  check(
    "a multi-day hall booking reads '2 days' and 'each day'",
    hallSchedule.dates.endsWith("· 2 days") && hallSchedule.time === "10:00 AM – 5:00 PM each day",
    `${hallSchedule.dates} | ${hallSchedule.time}`,
  );
  const staySchedule = formatSchedule({ facilityType: "GUEST_HOUSE", fromDate: "2026-10-02", toDate: "2026-10-04", startTime: "15:00:00", endTime: "11:00:00" });
  check(
    "a guest house stay reads in nights with check-in/out",
    staySchedule.dates.endsWith("· 2 nights") && staySchedule.time === "Check-in 3:00 PM · Check-out 11:00 AM",
    `${staySchedule.dates} | ${staySchedule.time}`,
  );

  // -------------------------------------------------- per-day hours
  console.log("\nPer-day hours (slots)");

  const perDay = await createBooking(
    {
      facilityType: "AUDITORIUM",
      eventName: "Tech fest",
      department: "ECE",
      slots: [
        { date: day(12), startTime: "10:00", endTime: "17:00" },
        { date: day(13), startTime: "09:00", endTime: "12:00" },
      ],
    },
    STUDENT,
  );
  check(
    "a request can carry different hours per day",
    perDay.slots.length === 2 &&
      perDay.slots[0].endTime === "17:00:00" &&
      perDay.slots[1].endTime === "12:00:00" &&
      perDay.fromDate === day(12) &&
      perDay.toDate === day(13),
    JSON.stringify(perDay.slots),
  );
  await approveBooking(perDay.bookingId, "AUDITORIUM", RESOURCE_ADMIN);
  const afternoonDay2 = await createBooking(
    {
      facilityType: "AUDITORIUM",
      eventName: "Free afternoon",
      department: "IT",
      fromDate: day(13),
      toDate: day(13),
      startTime: "14:00:00",
      endTime: "16:00:00",
    },
    STUDENT,
  );
  check("day 2's afternoon is free because that day ends at noon", afternoonDay2.bookingId > 0);
  await expectConflict(
    "day 1's afternoon is still blocked (that day runs to 5 PM)",
    () =>
      createBooking(
        {
          facilityType: "AUDITORIUM",
          eventName: "Clash",
          department: "IT",
          fromDate: day(12),
          toDate: day(12),
          startTime: "14:00:00",
          endTime: "16:00:00",
        },
        STUDENT,
      ),
    "Already booked by ECE for 'Tech fest'",
  );
  const [slotDay1, slotDay2] = await getCalendarStatus(day(12), day(13));
  check(
    "calendar reads each day's own hours",
    slotDay1?.auditorium.afternoon === "BOOKED" &&
      slotDay2?.auditorium.morning === "BOOKED" &&
      slotDay2?.auditorium.afternoon === "PENDING" && // the 2–4 PM request above
      slotDay2?.entries.find((e) => e.id === perDay.bookingId)?.endTime === "12:00:00",
    `${slotDay1?.auditorium.afternoon} / ${slotDay2?.auditorium.morning} / ${slotDay2?.auditorium.afternoon}`,
  );
  const perDaySchedule = formatSchedule(bookingToRowForTest(perDay));
  check(
    "different hours read as 'Varies by day' with a per-day list",
    perDaySchedule.time === "Varies by day" && perDaySchedule.showPerDay && perDaySchedule.perDay.length === 2,
    `${perDaySchedule.time} | ${perDaySchedule.perDay.map((l) => l.time).join(", ")}`,
  );
  const nonConsecutive = createBookingSchema.safeParse({
    facilityType: "AUDITORIUM",
    eventName: "x",
    department: "CSE",
    slots: [
      { date: day(20), startTime: "10:00", endTime: "12:00" },
      { date: day(22), startTime: "10:00", endTime: "12:00" },
    ],
  });
  check(
    "days need not be consecutive; summary spans first to last",
    nonConsecutive.success && nonConsecutive.data.fromDate === day(20) && nonConsecutive.data.toDate === day(22),
  );
  check(
    "the same day twice is rejected",
    !createBookingSchema.safeParse({
      facilityType: "AUDITORIUM",
      eventName: "x",
      department: "CSE",
      slots: [
        { date: day(20), startTime: "10:00", endTime: "12:00" },
        { date: day(20), startTime: "13:00", endTime: "15:00" },
      ],
    }).success,
  );

  // -------------------------------------------------------- cancellation
  console.log("\nCancelling approved bookings");

  const cancelled = await cancelBooking(
    morningOnly.bookingId,
    "AUDITORIUM",
    RESOURCE_ADMIN,
    "Hall needed for the college function",
  );
  check(
    "an approved booking can be cancelled with a reason",
    cancelled.bookingStatus === "CANCELLED" &&
      cancelled.adminMessage === "Hall needed for the college function" &&
      cancelled.decidedBy === RESOURCE_ADMIN.name,
  );

  const [afterCancel] = await getCalendarStatus(day(6), day(6));
  check(
    "a cancelled booking disappears from the calendar",
    afterCancel?.auditorium.status === "AVAILABLE" &&
      !afterCancel.entries.some((e) => e.id === morningOnly.bookingId),
    `got ${afterCancel?.auditorium.status}`,
  );

  const rebooked = await createBooking(
    {
      facilityType: "AUDITORIUM",
      eventName: "Takes the freed slot",
      department: "ECE",
      fromDate: day(6),
      toDate: day(6),
      startTime: "08:00:00",
      endTime: "11:00:00",
    },
    STUDENT,
  );
  check("the freed slot can be booked again", rebooked.bookingId > 0);

  let pendingCancelError: unknown = null;
  try {
    await cancelBooking(rebooked.bookingId, "AUDITORIUM", RESOURCE_ADMIN);
  } catch (error) {
    pendingCancelError = error;
  }
  check(
    "a pending request cannot be cancelled (reject it instead)",
    pendingCancelError instanceof InvalidStateError,
    String(pendingCancelError),
  );

  let wrongFacilityError: unknown = null;
  try {
    await cancelBooking(rebooked.bookingId, "SEMINAR_HALL", SEMINAR_ADMIN);
  } catch (error) {
    wrongFacilityError = error;
  }
  check(
    "cancelling with the wrong facility finds nothing",
    wrongFacilityError instanceof Error && wrongFacilityError.name === "NotFoundError",
  );

  await approveGuestHouseBooking(room3.bookingId, RESOURCE_ADMIN);
  const stayCancelled = await cancelGuestHouseBooking(room3.bookingId, RESOURCE_ADMIN, "Guest trip postponed");
  check(
    "an approved guest house stay can be cancelled",
    stayCancelled.status === "CANCELLED" && stayCancelled.adminMessage === "Guest trip postponed",
  );
  const room3Again = await createGuestHouseBooking(
    {
      guestName: "New Guest",
      phoneNumber: "+91 92222 22222",
      fromDate: day(5),
      toDate: day(8),
      roomNumber: 3,
    },
    STUDENT,
  );
  check("a cancelled stay stops blocking the room", room3Again.bookingId > 0);

  // ---------------------------------------------------------- validation
  console.log("\nInput validation");

  const base = {
    facilityType: "SEMINAR_HALL",
    eventName: "Check",
    department: "CSE",
    fromDate: day(2),
    toDate: day(2),
    startTime: "10:00",
    endTime: "12:00",
  };
  check("end date before start date is rejected", !createBookingSchema.safeParse({ ...base, fromDate: day(9) }).success);
  check("a date in the past is rejected", !createBookingSchema.safeParse({ ...base, fromDate: day(-1), toDate: day(-1) }).success);
  check("today is still allowed", createBookingSchema.safeParse({ ...base, fromDate: day(1), toDate: day(1) }).success);
  check(
    "a guest house check-in in the past is rejected",
    !createGuestHouseBookingSchema.safeParse({
      guestName: "X",
      phoneNumber: "1234567",
      fromDate: day(-2),
      toDate: day(3),
      roomNumber: 1,
    }).success,
  );
  check("end time before start time is rejected", !createBookingSchema.safeParse({ ...base, startTime: "15:00" }).success);
  check("an unknown department is rejected", !createBookingSchema.safeParse({ ...base, department: "COMPUTER SCIENCE" }).success);
  check("HH:MM from the form is normalised to HH:MM:SS", createBookingSchema.safeParse(base).data?.startTime === "10:00:00");
  check(
    "room number 0 is rejected",
    !createGuestHouseBookingSchema.safeParse({
      guestName: "X",
      phoneNumber: "1234567",
      fromDate: day(2),
      toDate: day(3),
      roomNumber: 0,
    }).success,
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log("Booking tables were left empty.\n");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
