import type { Metadata } from "next";

import { RefreshButton } from "@/components/refresh-button";
import { RequestTable } from "@/components/request-table";
import { getSessionUser } from "@/lib/auth/roles";
import {
  getBookingsForUser,
  getGuestHouseBookingsForUser,
} from "@/lib/bookings/service";
import { bookingToRow, byNewestFirst, guestHouseToRow } from "@/lib/bookings/view";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const [hallBookings, guestBookings] = await Promise.all([
    getBookingsForUser(sessionUser.userId),
    getGuestHouseBookingsForUser(sessionUser.userId),
  ]);

  const rows = [
    ...hallBookings.map(bookingToRow),
    ...guestBookings.map(guestHouseToRow),
  ].sort(byNewestFirst);

  const approved = rows.filter((row) => row.status === "APPROVED").length;
  const pending = rows.filter((row) => row.status === "PENDING").length;

  return (
    <div className="mx-auto w-full max-w-7xl px-2 pb-12 sm:px-4">
      <header className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3 sm:mt-4 sm:mb-8">
        <div>
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Your history</h1>
        <p className="mt-2 text-gray-500">
          Every request you have made, newest first — {rows.length} in total,{" "}
          {approved} approved and {pending} still waiting.
        </p>
        </div>
        <RefreshButton />
      </header>

      <RequestTable
        rows={rows}
        emptyMessage="You have not booked anything yet. Pick a facility on the dashboard to make your first request."
      />
    </div>
  );
}
