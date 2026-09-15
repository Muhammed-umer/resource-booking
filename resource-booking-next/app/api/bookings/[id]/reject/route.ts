import { decideViaApi } from "@/lib/bookings/decide-route";

/** POST /api/bookings/{id}/reject?facilityType=SEMINAR_HALL */
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return decideViaApi(request, context, "REJECTED");
}
