import "server-only";

import type { DevAccount } from "@/components/sign-in-form";
import { ROLE_LABELS } from "@/lib/auth/policy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * DEV ONLY — REMOVE BEFORE RELEASE.
 *
 * Lists the accounts in the database on the sign-in page so they can be
 * filled in with one click. Passwords cannot be read back from their hashes,
 * so the one shown is DEV_LOGIN_PASSWORD (default "password123"), which is
 * what every account created for development uses.
 *
 * Returns nothing in production, so the panel never renders there.
 */
export async function devAccounts(): Promise<DevAccount[]> {
  if (process.env.NODE_ENV === "production") return [];

  const password = process.env.DEV_LOGIN_PASSWORD?.trim() || "password123";

  const rows = await db
    .select({ email: users.email, name: users.name, role: users.role, department: users.department })
    .from(users)
    .orderBy(users.id);

  return rows.map((row) => ({
    email: row.email,
    label:
      row.role === "USER"
        ? `${row.department ?? row.name} department`
        : ROLE_LABELS[row.role],
    password,
  }));
}
