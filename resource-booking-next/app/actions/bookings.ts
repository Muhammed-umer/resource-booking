"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, requireFacilityAdmin, requireRole } from "@/lib/auth/roles";
import {
  approveBooking,
  approveGuestHouseBooking,
  BookingConflictError,
  cancelBooking,
  cancelGuestHouseBooking,
  createBooking,
  createGuestHouseBooking,
  InvalidStateError,
  NotFoundError,
  rejectBooking,
  rejectGuestHouseBooking,
} from "@/lib/bookings/service";
import { notifyCancellation, notifyDecision, notifyNewRequest } from "@/lib/mail/notify";
import {
  createBookingSchema,
  createGuestHouseBookingSchema,
  decisionSchema,
  formatZodError,
} from "@/lib/validation";

export type ActionResult = { ok: boolean; message: string };

/** Turns a thrown domain error into a message the UI can show as-is. */
function toResult(error: unknown): ActionResult {
  if (
    error instanceof BookingConflictError ||
    error instanceof AuthorizationError ||
    error instanceof NotFoundError ||
    error instanceof InvalidStateError
  ) {
    return { ok: false, message: error.message };
  }

  console.error("Booking action failed:", error);
  return {
    ok: false,
    message: "Something went wrong saving the booking. Please try again.",
  };
}

function refreshBookingViews() {
  revalidatePath("/user");
  revalidatePath("/user/availability");
  revalidatePath("/admin/availability");
  revalidatePath("/user/history");
  revalidatePath("/user/waiting-request");
  revalidatePath("/admin/seminar");
  revalidatePath("/admin/resource");
  revalidatePath("/admin/resource/guest-house");
}

/** Create a seminar hall or auditorium request. Users only, as in Login-ui. */
export async function createBookingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireRole("USER");

    // The department comes from the account, never from the form — a request
    // is always filed under the department that signed in.
    if (!user.department) {
      return {
        ok: false,
        message:
          "Your account has no department set, so it cannot book halls. Contact the office.",
      };
    }

    const parsed = createBookingSchema.safeParse({
      facilityType: formData.get("facilityType"),
      eventName: formData.get("eventName"),
      department: user.department,
      fromDate: formData.get("fromDate"),
      toDate: formData.get("toDate"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const booking = await createBooking(parsed.data, user);
    notifyNewRequest(booking);
    refreshBookingViews();

    return {
      ok: true,
      message: `Request #${booking.bookingId} sent. It is pending admin approval.`,
    };
  } catch (error) {
    return toResult(error);
  }
}

/** Create a guest house stay. Users only. */
export async function createGuestHouseBookingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireRole("USER");

    const parsed = createGuestHouseBookingSchema.safeParse({
      guestName: formData.get("guestName"),
      phoneNumber: formData.get("phoneNumber"),
      purpose: formData.get("purpose") || undefined,
      fromDate: formData.get("fromDate"),
      toDate: formData.get("toDate"),
      checkInTime: formData.get("checkInTime") || undefined,
      checkOutTime: formData.get("checkOutTime") || undefined,
      roomNumber: formData.get("roomNumber"),
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const booking = await createGuestHouseBooking(parsed.data, user);
    notifyNewRequest(booking);
    refreshBookingViews();

    return {
      ok: true,
      message: `Room ${booking.roomNumber} requested. It is pending admin approval.`,
    };
  } catch (error) {
    return toResult(error);
  }
}

/**
 * Single entry point for the booking modal, which can submit either kind of
 * request. Dispatches on the facility the user picked.
 */
export async function createRequestAction(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const facilityType = formData.get("facilityType");

  if (facilityType === "GUEST_HOUSE") {
    return createGuestHouseBookingAction(prev, formData);
  }

  return createBookingAction(prev, formData);
}

/**
 * Approve or reject a request. The facility is re-checked against the caller's
 * role, so a seminar admin cannot act on an auditorium booking and vice versa.
 */
export async function decideBookingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = decisionSchema.safeParse({
      bookingId: formData.get("bookingId"),
      facilityType: formData.get("facilityType"),
      adminMessage: formData.get("adminMessage") || undefined,
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const decision = formData.get("decision");
    if (decision !== "APPROVE" && decision !== "REJECT") {
      return { ok: false, message: "Choose either approve or reject." };
    }

    const { bookingId, facilityType, adminMessage } = parsed.data;
    const admin = await requireFacilityAdmin(facilityType);

    const decided =
      facilityType === "GUEST_HOUSE"
        ? decision === "APPROVE"
          ? await approveGuestHouseBooking(bookingId, admin, adminMessage)
          : await rejectGuestHouseBooking(bookingId, admin, adminMessage)
        : decision === "APPROVE"
          ? await approveBooking(bookingId, facilityType, admin, adminMessage)
          : await rejectBooking(bookingId, facilityType, admin, adminMessage);

    notifyDecision(decided);
    refreshBookingViews();

    return {
      ok: true,
      message:
        decision === "APPROVE"
          ? `Booking #${bookingId} approved.`
          : `Booking #${bookingId} rejected.`,
    };
  } catch (error) {
    return toResult(error);
  }
}

/**
 * Cancel an approved booking, with an optional reason shown to the requester.
 * Same role check as approve/reject: only the facility's own admin may do it.
 */
export async function cancelBookingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = decisionSchema.safeParse({
      bookingId: formData.get("bookingId"),
      facilityType: formData.get("facilityType"),
      adminMessage: formData.get("reason") || undefined,
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const { bookingId, facilityType, adminMessage } = parsed.data;
    const admin = await requireFacilityAdmin(facilityType);

    const cancelled =
      facilityType === "GUEST_HOUSE"
        ? await cancelGuestHouseBooking(bookingId, admin, adminMessage)
        : await cancelBooking(bookingId, facilityType, admin, adminMessage);

    notifyCancellation(cancelled);
    refreshBookingViews();

    return { ok: true, message: `Booking #${bookingId} cancelled. The slot is free again.` };
  } catch (error) {
    return toResult(error);
  }
}
