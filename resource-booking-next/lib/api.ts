import { AuthorizationError } from "@/lib/auth/roles";
import {
  BookingConflictError,
  InvalidStateError,
  NotFoundError,
} from "@/lib/bookings/service";

/**
 * Maps a domain error onto the status codes the Spring controllers returned:
 * 409 for a clash (body is the plain message, as the old frontend expected),
 * 403 for a role violation, 404 for a missing row. A booking in the wrong
 * state for the action (e.g. cancelling a pending one) is also a 409.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof BookingConflictError || error instanceof InvalidStateError) {
    return new Response(error.message, {
      status: 409,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (error instanceof AuthorizationError) {
    return new Response(error.message, {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (error instanceof NotFoundError) {
    return new Response(error.message, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  console.error("Unhandled API error:", error);
  return new Response("Unexpected server error.", { status: 500 });
}

export function badRequest(message: string): Response {
  return new Response(message, {
    status: 400,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
