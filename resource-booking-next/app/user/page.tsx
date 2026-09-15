import type { Metadata } from "next";

import { BookingSurface } from "@/components/home/booking-surface";
import { getSessionUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Dashboard" };

export default async function UserHomePage() {
  const sessionUser = await getSessionUser();

  return (
    <div className="relative mx-auto w-full max-w-7xl px-2 pb-2 sm:px-4">
      <header className="mt-1 mb-6 sm:mt-2 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Dashboard</h1>
        <p className="mt-2 text-gray-500">
          Select a facility to view details or book a slot.
        </p>
      </header>

      <BookingSurface department={sessionUser?.department ?? null} />
    </div>
  );
}
