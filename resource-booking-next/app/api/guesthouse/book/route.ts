import { badRequest, errorResponse } from "@/lib/api";
import { requireRole } from "@/lib/auth/roles";
import { createGuestHouseBooking } from "@/lib/bookings/service";
import { notifyNewRequest } from "@/lib/mail/notify";
import { createGuestHouseBookingSchema, formatZodError } from "@/lib/validation";

/** POST /guesthouse/book equivalent — create a room request. Users only. */
export async function POST(request: Request) {
  try {
    const user = await requireRole("USER");
    const parsed = createGuestHouseBookingSchema.safeParse(await request.json());

    if (!parsed.success) {
      return badRequest(formatZodError(parsed.error));
    }

    const booking = await createGuestHouseBooking(parsed.data, user);
    notifyNewRequest(booking);
    return Response.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
