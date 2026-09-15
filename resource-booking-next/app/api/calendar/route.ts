import { badRequest, errorResponse } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/roles";
import { getCalendarStatus } from "@/lib/bookings/service";
import { calendarRangeSchema, formatZodError } from "@/lib/validation";

/**
 * GET /api/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Public, matching the Spring config where the calendar was readable without a
 * session. Returns one row per day with a status per facility. The bookings
 * behind each day (who, what, when) are only included for signed-in callers.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = calendarRangeSchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (!parsed.success) {
      return badRequest(formatZodError(parsed.error));
    }

    const [days, sessionUser] = await Promise.all([
      getCalendarStatus(parsed.data.startDate, parsed.data.endDate),
      getSessionUser(),
    ]);

    return Response.json(
      sessionUser ? days : days.map((day) => ({ ...day, entries: [] })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
