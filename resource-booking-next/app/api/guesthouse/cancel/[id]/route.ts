import { badRequest, errorResponse } from "@/lib/api";
import { requireFacilityAdmin } from "@/lib/auth/roles";
import { cancelGuestHouseBooking } from "@/lib/bookings/service";
import { notifyCancellation } from "@/lib/mail/notify";

/**
 * PUT /api/guesthouse/cancel/{id}
 * Body (optional): { "adminMessage": "reason shown to the requester" }
 */
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

    let reason: string | undefined;
    try {
      const body = (await request.json()) as { adminMessage?: unknown };
      if (typeof body?.adminMessage === "string") reason = body.adminMessage.slice(0, 500);
    } catch {
      // no body
    }

    const updated = await cancelGuestHouseBooking(bookingId, admin, reason);
    notifyCancellation(updated);
    return Response.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
