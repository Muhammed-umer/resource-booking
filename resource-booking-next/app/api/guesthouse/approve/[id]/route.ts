import { badRequest, errorResponse } from "@/lib/api";
import { requireFacilityAdmin } from "@/lib/auth/roles";
import { approveGuestHouseBooking } from "@/lib/bookings/service";
import { notifyDecision } from "@/lib/mail/notify";

/** PUT /api/guesthouse/approve/{id} */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireFacilityAdmin("GUEST_HOUSE");

    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return badRequest(`Invalid booking id: ${id}`);
    }

    const updated = await approveGuestHouseBooking(bookingId, admin);
    notifyDecision(updated);
    return Response.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
