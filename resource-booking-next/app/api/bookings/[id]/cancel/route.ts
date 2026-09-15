import { decideViaApi } from "@/lib/bookings/decide-route";

/**
 * POST /api/bookings/{id}/cancel?facilityType=AUDITORIUM
 * Body (optional): { "adminMessage": "reason shown to the requester" }
 * Only approved bookings can be cancelled; the slot is freed immediately.
 */
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return decideViaApi(request, context, "CANCELLED");
}
