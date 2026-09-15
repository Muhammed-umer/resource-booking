"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/app/actions/bookings";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { homePathForRole } from "@/lib/auth/policy";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

/**
 * Hash to check against when the email is unknown, so a wrong email and a wrong
 * password take the same time and the form does not reveal which accounts exist.
 */
const decoyHash = hashPassword("decoy-password-never-matches");

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  let user: User | undefined;
  let passwordMatches = false;

  try {
    [user] = await db.select().from(users).where(eq(users.email, email));
    passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? (await decoyHash),
    );
  } catch (error) {
    console.error("Login failed:", error);
    return {
      ok: false,
      message: "Could not reach the database. Check DATABASE_URL and try again.",
    };
  }

  if (!user || !passwordMatches) {
    return { ok: false, message: "Email or password is wrong." };
  }

  const token = await createSessionToken(user.id);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());

  redirect(homePathForRole(user.role));
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/sign-in");
}
