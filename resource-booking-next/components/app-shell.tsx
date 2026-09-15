"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { NavIcon, type NavIconName } from "@/components/nav-icons";
import type { AppPath } from "@/lib/routes";

export type NavItem = {
  href: AppPath;
  label: string;
  icon: NavIconName;
};

/**
 * Navbar + sidebar + scrolling main area, ported from the Vite UserLayout and
 * AdminLayout. Both layouts were identical apart from their links, so this is
 * one component driven by the `items` it is given.
 */
export function AppShell({
  items,
  roleLabel,
  userName,
  children,
}: {
  items: NavItem[];
  roleLabel: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Exactly one link is active: the one whose href matches the current path,
  // or, failing that, the longest href the path sits under. That keeps
  // /admin/resource from lighting up while on /admin/resource/guest-house.
  const activeHref =
    items.find((item) => item.href === pathname)?.href ??
    items
      .filter((item) => pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ??
    null;

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      <nav className="relative z-50 flex h-16 w-full items-center justify-between bg-primary px-4 text-white shadow-lg md:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen((open) => !open)}
            className="block rounded p-1 transition-colors hover:bg-primary-dark md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={isMobileSidebarOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/30 bg-white/20 text-xs backdrop-blur-sm">
              GCE
            </div>
            <span className="hidden text-lg font-semibold tracking-wide sm:inline">
              Resource Booking
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-semibold">{userName}</div>
            <div className="text-xs text-white/75">{roleLabel}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="relative flex flex-1 overflow-hidden">
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}

        <aside
          className={`absolute z-30 h-full w-64 transform bg-primary text-white shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex h-full flex-col gap-2 p-5">
            {items.map((item) => {
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    isActive
                      ? "bg-white text-primary shadow-md"
                      : "text-white hover:bg-primary-dark"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
