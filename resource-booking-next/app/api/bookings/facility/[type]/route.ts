import { badRequest, errorResponse } from "@/lib/api";
import { ADMIN_ROLES, requireRole } from "@/lib/auth/roles";
import { getBookingsByFacility } from "@/lib/bookings/service";
import { facilityTypeSchema } from "@/lib/validation";

/** GET /api/bookings/facility/{type} — bookings for one facility. Admins only. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    await requireRole(...ADMIN_ROLES);

    const { type } = await params;
    const parsed = facilityTypeSchema.safeParse(type.toUpperCase());

    if (!parsed.success) {
      return badRequest(`Invalid facility type: ${type}`);
    }

    return Response.json(await getBookingsByFacility(parsed.data));
  } catch (error) {
    return errorResponse(error);
  }
}
