import { errorResponse } from "@/lib/api";
import {
  ADMIN_ROLES,
  canManageFacility,
  FACILITIES_BY_ROLE,
  requireRole,
} from "@/lib/auth/roles";
import {
  getPendingBookings,
  getPendingGuestHouseBookings,
} from "@/lib/bookings/service";
import { bookingToRow, byNewestFirst, guestHouseToRow } from "@/lib/bookings/view";
import { facilityTypeSchema } from "@/lib/validation";

/**
 * GET /api/bookings/pending?facilityType=SEMINAR_HALL[,AUDITORIUM]
 *
 * The queue the old admin screens called but the Spring controller never
 * exposed. Defaults to every facility the caller's role owns, and silently
 * drops any facility they do not own rather than leaking another admin's queue.
 */
export async function GET(request: Request) {
  try {
    const admin = await requireRole(...ADMIN_ROLES);
    const { searchParams } = new URL(request.url);
    const requested = searchParams.get("facilityType");

    const facilities = requested
      ? requested
          .split(",")
          .map((value) => facilityTypeSchema.safeParse(value.trim().toUpperCase()))
          .flatMap((result) => (result.success ? [result.data] : []))
          .filter((facility) => canManageFacility(admin.role, facility))
      : [...FACILITIES_BY_ROLE[admin.role]];

    const [hallBookings, guestBookings] = await Promise.all([
      getPendingBookings(facilities),
      facilities.includes("GUEST_HOUSE")
        ? getPendingGuestHouseBookings()
        : Promise.resolve([]),
    ]);

    const rows = [
      ...hallBookings.map(bookingToRow),
      ...guestBookings.map(guestHouseToRow),
    ].sort(byNewestFirst);

    return Response.json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}
