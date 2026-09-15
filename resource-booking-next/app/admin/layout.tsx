import { redirect } from "next/navigation";

import { AppShell, type NavItem } from "@/components/app-shell";
import {
  getSessionUser,
  homePathForRole,
  isAdminRole,
  ROLE_LABELS,
  type Role,
} from "@/lib/auth/roles";

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  USER: [],
  ADMIN_SEMINAR: [
    { href: "/admin/seminar", label: "Seminar Hall", icon: "seminar" },
    { href: "/admin/availability", label: "Availability Radar", icon: "calendar" },
  ],
  ADMIN_RESOURCE: [
    { href: "/admin/resource", label: "Auditorium", icon: "auditorium" },
    { href: "/admin/resource/guest-house", label: "Guest House", icon: "guest" },
    { href: "/admin/availability", label: "Availability Radar", icon: "calendar" },
  ],
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) redirect("/sign-in");
  if (!isAdminRole(sessionUser.role)) redirect(homePathForRole(sessionUser.role));

  return (
    <AppShell
      items={NAV_BY_ROLE[sessionUser.role]}
      roleLabel={ROLE_LABELS[sessionUser.role]}
      userName={sessionUser.name}
    >
      {children}
    </AppShell>
  );
}
