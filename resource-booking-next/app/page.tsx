import { redirect } from "next/navigation";

import { getSessionUser, homePathForRole } from "@/lib/auth/roles";

/** The landing route sends each account where it belongs. */
export default async function RootPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");

  redirect(homePathForRole(sessionUser.role));
}
