import type {
  Booking,
  BookingStatus,
  FacilityType,
  GuestHouseBooking,
} from "@/lib/db/schema";

/**
 * One shape for both tables, so history, the report and the admin queue can
 * share a single list component.
 */
export type RequestRow = {
  id: number;
  facilityType: FacilityType;
  title: string;
  detail: string;
  fromDate: string;
  toDate: string;
  startTime: string | null;
  endTime: string | null;
  status: BookingStatus;
  requestedByName: string;
  adminMessage: string | null;
  decidedBy: string | null;
  createdAt: Date;
};

export function bookingToRow(booking: Booking): RequestRow {
  return {
    id: booking.bookingId,
    facilityType: booking.facilityType,
    title: booking.eventName,
    detail: booking.department,
    fromDate: booking.fromDate,
    toDate: booking.toDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.bookingStatus,
    requestedByName: booking.requestedByName,
    adminMessage: booking.adminMessage,
    decidedBy: booking.decidedBy,
    createdAt: booking.createdAt,
  };
}

export function guestHouseToRow(booking: GuestHouseBooking): RequestRow {
  return {
    id: booking.bookingId,
    facilityType: "GUEST_HOUSE",
    title: `Room ${booking.roomNumber} · ${booking.guestName}`,
    detail: booking.purpose ?? "No purpose given",
    fromDate: booking.fromDate,
    toDate: booking.toDate,
    startTime: booking.checkInTime,
    endTime: booking.checkOutTime,
    status: booking.status,
    requestedByName: booking.requestedByName,
    adminMessage: booking.adminMessage,
    decidedBy: booking.decidedBy,
    createdAt: booking.createdAt,
  };
}

export function byNewestFirst(a: RequestRow, b: RequestRow): number {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Number of calendar days a range covers, inclusive: 19–20 Sep is 2. */
export function countDays(from: string, to: string): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000) + 1;
}

/**
 * "19 Sep 2026" for one day; "19 – 20 Sep 2026" when the month is shared,
 * "28 Sep – 2 Oct 2026" across months, "30 Dec 2026 – 2 Jan 2027" across years.
 */
export function formatDateRange(from: string, to: string): string {
  const a = parseISO(from);
  const b = parseISO(to);
  const opts = { timeZone: "UTC" } as const;
  const full = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...opts });

  if (from === to) return full(a);
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${full(a)} – ${full(b)}`;
  if (a.getUTCMonth() !== b.getUTCMonth()) {
    const dayMonth = (d: Date) =>
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...opts });
    return `${dayMonth(a)} – ${full(b)}`;
  }
  return `${a.getUTCDate()} – ${full(b)}`;
}

/** "Fri, 19 Sep 2026" — used where there is room for the weekday. */
export function formatLongDate(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The one place that spells out what a booking's dates and times mean.
 *
 * Halls: the time window applies on EACH day of the range, so a 19–20 Sep
 * 10 AM–5 PM booking is 10–5 on both days, never 10 AM Friday through 5 PM
 * Saturday. Guest house: dates are nights stayed, times are check-in/out.
 */
export function formatSchedule(row: Pick<RequestRow, "facilityType" | "fromDate" | "toDate" | "startTime" | "endTime">): {
  dates: string;
  time: string;
  /** Calendar days for halls, nights for the guest house. */
  span: number;
  spanLabel: string;
} {
  const days = countDays(row.fromDate, row.toDate);
  const dates = formatDateRange(row.fromDate, row.toDate);

  if (row.facilityType === "GUEST_HOUSE") {
    const nights = Math.max(days - 1, 1);
    const spanLabel = `${nights} night${nights === 1 ? "" : "s"}`;
    const checkIn = row.startTime ? `Check-in ${formatTime12h(row.startTime)}` : null;
    const checkOut = row.endTime ? `Check-out ${formatTime12h(row.endTime)}` : null;
    return {
      dates: `${dates} · ${spanLabel}`,
      time: [checkIn, checkOut].filter(Boolean).join(" · ") || "—",
      span: nights,
      spanLabel,
    };
  }

  const spanLabel = `${days} day${days === 1 ? "" : "s"}`;
  const time = formatTimeRange(row.startTime, row.endTime);
  return {
    dates: days === 1 ? dates : `${dates} · ${spanLabel}`,
    time: days === 1 || time === "—" ? time : `${time} each day`,
    span: days,
    spanLabel,
  };
}

/** "13:05:00" -> "1:05 PM". Times are stored 24-hour; shown 12-hour everywhere. */
export function formatTime12h(time: string): string {
  const [hourStr, minuteStr = "00"] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr.padStart(2, "0")} ${period}`;
}

export function formatTimeRange(
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) return "—";
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}
