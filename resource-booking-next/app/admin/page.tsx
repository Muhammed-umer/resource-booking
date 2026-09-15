import { redirect } from "next/navigation";

import { getSessionUser, homePathForRole } from "@/lib/auth/roles";

export default async function AdminIndexPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");

  redirect(homePathForRole(sessionUser.role));
}
