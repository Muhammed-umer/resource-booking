import { badRequest, errorResponse } from "@/lib/api";
import { ADMIN_ROLES, requireRole } from "@/lib/auth/roles";
import { createBooking, getAllBookings } from "@/lib/bookings/service";
import { notifyNewRequest } from "@/lib/mail/notify";
import { createBookingSchema, formatZodError } from "@/lib/validation";

/** POST /api/bookings — create a hall request. Users only. */
export async function POST(request: Request) {
  try {
    const user = await requireRole("USER");

    if (!user.department) {
      return badRequest(
        "Your account has no department set, so it cannot book halls. Contact the office.",
      );
    }

    // Department is fixed by the account; any value in the body is ignored.
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = createBookingSchema.safeParse({
      ...body,
      department: user.department,
    });

    if (!parsed.success) {
      return badRequest(formatZodError(parsed.error));
    }

    const booking = await createBooking(parsed.data, user);
    notifyNewRequest(booking);
    return Response.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** GET /api/bookings — every hall booking. Admins only. */
export async function GET() {
  try {
    await requireRole(...ADMIN_ROLES);
    return Response.json(await getAllBookings());
  } catch (error) {
    return errorResponse(error);
  }
}
