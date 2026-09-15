import { redirect } from "next/navigation";

import { AppShell, type NavItem } from "@/components/app-shell";
import { getSessionUser, homePathForRole, ROLE_LABELS } from "@/lib/auth/roles";

const NAV_ITEMS: NavItem[] = [
  { href: "/user", label: "Home", icon: "home" },
  { href: "/user/availability", label: "Availability Radar", icon: "calendar" },
  { href: "/user/waiting-request", label: "Overall Report", icon: "report" },
  { href: "/user/history", label: "History", icon: "history" },
];

export default async function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) redirect("/sign-in");
  if (sessionUser.role !== "USER") redirect(homePathForRole(sessionUser.role));

  return (
    <AppShell
      items={NAV_ITEMS}
      roleLabel={ROLE_LABELS[sessionUser.role]}
      userName={sessionUser.name}
    >
      {children}
    </AppShell>
  );
}
