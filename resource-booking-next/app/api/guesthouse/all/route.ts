import { errorResponse } from "@/lib/api";
import { ADMIN_ROLES, requireRole } from "@/lib/auth/roles";
import { getAllGuestHouseBookings } from "@/lib/bookings/service";

/** GET /api/guesthouse/all — every room booking. Admins only. */
export async function GET() {
  try {
    await requireRole(...ADMIN_ROLES);
    return Response.json(await getAllGuestHouseBookings());
  } catch (error) {
    return errorResponse(error);
  }
}
