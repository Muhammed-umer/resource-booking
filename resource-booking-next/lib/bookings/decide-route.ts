import "server-only";

import { badRequest, errorResponse } from "@/lib/api";
import { requireFacilityAdmin } from "@/lib/auth/roles";
import {
  approveBooking,
  approveGuestHouseBooking,
  cancelBooking,
  cancelGuestHouseBooking,
  rejectBooking,
  rejectGuestHouseBooking,
} from "@/lib/bookings/service";
import { notifyCancellation, notifyDecision } from "@/lib/mail/notify";
import { facilityTypeSchema } from "@/lib/validation";

/**
 * Shared body of the approve and reject route handlers. The facility comes
 * from the query string and is checked against the caller's role, which is the
 * @PreAuthorize expression the Spring controller used.
 */
export async function decideViaApi(
  request: Request,
  context: { params: Promise<{ id: string }> },
  status: "APPROVED" | "REJECTED" | "CANCELLED",
): Promise<Response> {
  try {
    const { id } = await context.params;
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return badRequest(`Invalid booking id: ${id}`);
    }

    const { searchParams } = new URL(request.url);
    const parsedFacility = facilityTypeSchema.safeParse(
      searchParams.get("facilityType")?.toUpperCase(),
    );

    if (!parsedFacility.success) {
      return badRequest(
        "Pass facilityType=SEMINAR_HALL, AUDITORIUM or GUEST_HOUSE.",
      );
    }

    const facilityType = parsedFacility.data;
    const admin = await requireFacilityAdmin(facilityType);

    let adminMessage: string | undefined;
    try {
      const body = (await request.json()) as { adminMessage?: unknown };
      if (typeof body?.adminMessage === "string") {
        adminMessage = body.adminMessage.slice(0, 500);
      }
    } catch {
      // No body is fine — the old endpoints took none.
    }

    const updated =
      facilityType === "GUEST_HOUSE"
        ? status === "APPROVED"
          ? await approveGuestHouseBooking(bookingId, admin, adminMessage)
          : status === "REJECTED"
            ? await rejectGuestHouseBooking(bookingId, admin, adminMessage)
            : await cancelGuestHouseBooking(bookingId, admin, adminMessage)
        : status === "APPROVED"
          ? await approveBooking(bookingId, facilityType, admin, adminMessage)
          : status === "REJECTED"
            ? await rejectBooking(bookingId, facilityType, admin, adminMessage)
            : await cancelBooking(bookingId, facilityType, admin, adminMessage);

    if (status === "CANCELLED") notifyCancellation(updated);
    else notifyDecision(updated);

    return Response.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
