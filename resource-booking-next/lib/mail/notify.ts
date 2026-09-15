import "server-only";

import { eq, inArray } from "drizzle-orm";
import { after } from "next/server";

import { canManageFacility, ROLES } from "@/lib/auth/policy";
import { bookingToRow, guestHouseToRow, type RequestRow } from "@/lib/bookings/view";
import { db } from "@/lib/db";
import { users, type Booking, type FacilityType, type GuestHouseBooking } from "@/lib/db/schema";
import { cancelledEmail, decisionEmail, newRequestEmail } from "@/lib/mail/templates";
import { APP_BASE_URL, sendMail, type MailResult } from "@/lib/mail/transport";

/**
 * Who to email for each booking event.
 *
 *   department files a request  -> the admin(s) who manage that facility
 *   admin approves / rejects    -> the department account that requested it
 *   admin cancels               -> the department account that requested it
 *
 * Recipients come from the users table: admins by role, the requester by the
 * id stored on the booking. Sending is scheduled with `after()` so the
 * response never waits on SMTP; outside a request (scripts) it runs inline.
 */

type Record_ = Booking | GuestHouseBooking;

function toRow(record: Record_): RequestRow {
  return "facilityType" in record ? bookingToRow(record) : guestHouseToRow(record);
}

const ADMIN_PAGE: Record<FacilityType, string> = {
  SEMINAR_HALL: "/admin/seminar",
  AUDITORIUM: "/admin/resource",
  GUEST_HOUSE: "/admin/resource/guest-house",
};

async function adminEmailsFor(facilityType: FacilityType): Promise<string[]> {
  const roles = ROLES.filter((role) => canManageFacility(role, facilityType));
  if (roles.length === 0) return [];
  const rows = await db.select({ email: users.email }).from(users).where(inArray(users.role, roles));
  return rows.map((row) => row.email);
}

async function requesterEmail(userId: string): Promise<string | null> {
  const id = Number(userId);
  if (!Number.isInteger(id)) return null;
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, id));
  return row?.email ?? null;
}

function schedule(job: () => Promise<MailResult>): void {
  const run = () =>
    job().catch((error) => {
      console.error("[mail] notification failed:", error);
    });

  try {
    after(run);
  } catch {
    // Not inside a request (e.g. a script): send inline instead.
    void run();
  }
}

/** Department -> admin: a new request needs a decision. */
export function notifyNewRequest(record: Record_): void {
  const row = toRow(record);
  schedule(async () => {
    const to = await adminEmailsFor(row.facilityType);
    const mail = newRequestEmail(row, `${APP_BASE_URL}${ADMIN_PAGE[row.facilityType]}`);
    return sendMail({ to, ...mail });
  });
}

/** Admin -> department: approved or rejected. */
export function notifyDecision(record: Record_): void {
  const row = toRow(record);
  schedule(async () => {
    const to = await requesterEmail(record.requestedBy);
    const mail = decisionEmail(row, `${APP_BASE_URL}/user/history`);
    return sendMail({ to: to ?? [], ...mail });
  });
}

/** Admin -> department: an approved booking was withdrawn. */
export function notifyCancellation(record: Record_): void {
  const row = toRow(record);
  schedule(async () => {
    const to = await requesterEmail(record.requestedBy);
    const mail = cancelledEmail(row, `${APP_BASE_URL}/user/history`);
    return sendMail({ to: to ?? [], ...mail });
  });
}
