import type {
  Booking,
  BookingStatus,
  FacilityType,
  GuestHouseBooking,
  Slot,
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
  /** Halls only: each booked day with its own hours. Guest house rows have none. */
  slots?: Slot[];
  status: BookingStatus;
  requestedByName: string;
  adminMessage: string | null;
  decidedBy: string | null;
  createdAt: Date;
};

export function bookingToRow(booking: Booking & { slots?: Slot[] }): RequestRow {
  return {
    id: booking.bookingId,
    facilityType: booking.facilityType,
    title: booking.eventName,
    detail: booking.department,
    fromDate: booking.fromDate,
    toDate: booking.toDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    slots: booking.slots,
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

/** "Fri 19 Sept" — compact day label for per-day lists. */
export function formatDayLabel(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
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

export type ScheduleLine = { date: string; day: string; time: string };

export type Schedule = {
  dates: string;
  time: string;
  /** Booked days for halls, nights for the guest house. */
  span: number;
  spanLabel: string;
  /** Halls with more than one day: every day with its hours. */
  perDay: ScheduleLine[];
  /** True when perDay should be shown instead of `time` (hours differ, or days are not consecutive). */
  showPerDay: boolean;
};

/**
 * The one place that spells out what a booking's dates and times mean.
 *
 * Halls: each booked day has its own hours (the slots). When every day has
 * the same hours the summary reads "10:00 AM – 5:00 PM each day"; otherwise
 * the per-day list is shown. Guest house: dates are nights stayed, times are
 * check-in/out.
 */
export function formatSchedule(
  row: Pick<RequestRow, "facilityType" | "fromDate" | "toDate" | "startTime" | "endTime"> & { slots?: Slot[] },
): Schedule {
  const dates = formatDateRange(row.fromDate, row.toDate);

  if (row.facilityType === "GUEST_HOUSE") {
    const nights = Math.max(countDays(row.fromDate, row.toDate) - 1, 1);
    const spanLabel = `${nights} night${nights === 1 ? "" : "s"}`;
    const checkIn = row.startTime ? `Check-in ${formatTime12h(row.startTime)}` : null;
    const checkOut = row.endTime ? `Check-out ${formatTime12h(row.endTime)}` : null;
    return {
      dates: `${dates} · ${spanLabel}`,
      time: [checkIn, checkOut].filter(Boolean).join(" · ") || "—",
      span: nights,
      spanLabel,
      perDay: [],
      showPerDay: false,
    };
  }

  // Without explicit slots, the row's hours apply to every day of its range.
  const slots: Slot[] =
    row.slots && row.slots.length > 0
      ? row.slots
      : row.startTime && row.endTime
        ? Array.from({ length: countDays(row.fromDate, row.toDate) }, (_, i) => {
            const d = parseISO(row.fromDate);
            d.setUTCDate(d.getUTCDate() + i);
            return { date: d.toISOString().slice(0, 10), startTime: row.startTime!, endTime: row.endTime! };
          })
        : [];

  const days = slots.length || countDays(row.fromDate, row.toDate);
  const spanLabel = `${days} day${days === 1 ? "" : "s"}`;
  const perDay = slots.map((slot) => ({
    date: slot.date,
    day: formatDayLabel(slot.date),
    time: formatTimeRange(slot.startTime, slot.endTime),
  }));
  const uniform = slots.every(
    (slot) => slot.startTime === slots[0].startTime && slot.endTime === slots[0].endTime,
  );
  const consecutive = slots.length === countDays(row.fromDate, row.toDate);
  const showPerDay = slots.length > 1 && (!uniform || !consecutive);

  const time =
    slots.length === 0
      ? "—"
      : slots.length === 1
        ? perDay[0].time
        : uniform
          ? `${perDay[0].time} each day`
          : "Varies by day";

  return {
    dates: days === 1 ? dates : `${dates} · ${spanLabel}`,
    time,
    span: days,
    spanLabel,
    perDay,
    showPerDay,
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
