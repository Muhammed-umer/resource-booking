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

export function formatDateRange(from: string, to: string): string {
  const format = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  return from === to ? format(from) : `${format(from)} – ${format(to)}`;
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
