import { badRequest, errorResponse } from "@/lib/api";
import { AuthorizationError, getSessionUser, isAdminRole } from "@/lib/auth/roles";
import { getGuestHouseBookingById } from "@/lib/bookings/service";

/**
 * GET /api/guesthouse/{id} — one room booking. Admins see any row; a user only
 * sees their own, which the Spring version did not check.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      throw new AuthorizationError("You are not signed in.");
    }

    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return badRequest(`Invalid booking id: ${id}`);
    }

    const booking = await getGuestHouseBookingById(bookingId);

    if (
      !isAdminRole(sessionUser.role) &&
      booking.requestedBy !== sessionUser.userId
    ) {
      throw new AuthorizationError("This booking belongs to someone else.");
    }

    return Response.json(booking);
  } catch (error) {
    return errorResponse(error);
  }
}
