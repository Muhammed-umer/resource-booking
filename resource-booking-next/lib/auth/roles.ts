import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import {
  ADMIN_ROLES,
  AuthorizationError,
  canManageFacility,
  FACILITY_LABELS,
  ROLE_LABELS,
  type Role,
  type SessionUser,
} from "@/lib/auth/policy";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, type FacilityType } from "@/lib/db/schema";

/**
 * Session-aware half of authorization: reads the login cookie and enforces the
 * policy in ./policy. Re-exported here so callers have one import.
 */
export * from "@/lib/auth/policy";

/**
 * Reads the signed-in user. Verifies the cookie signature, then loads the
 * account so the role is always current. Null when signed out, expired, or the
 * account has since been deleted.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const payload = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub));
  if (!user) return null;

  return {
    userId: String(user.id),
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department,
  };
}

/** Throws unless the caller is signed in and holds one of `allowed`. */
export async function requireRole(
  ...allowed: readonly Role[]
): Promise<SessionUser> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    throw new AuthorizationError("You are not signed in.");
  }

  if (!allowed.includes(sessionUser.role)) {
    throw new AuthorizationError(
      `This action needs ${allowed.map((r) => ROLE_LABELS[r]).join(" or ")} access.`,
    );
  }

  return sessionUser;
}

/** Throws unless the caller is an admin for `facility`. */
export async function requireFacilityAdmin(
  facility: FacilityType,
): Promise<SessionUser> {
  const sessionUser = await requireRole(...ADMIN_ROLES);

  if (!canManageFacility(sessionUser.role, facility)) {
    throw new AuthorizationError(
      `${ROLE_LABELS[sessionUser.role]} cannot act on ${FACILITY_LABELS[facility]} bookings.`,
    );
  }

  return sessionUser;
}
