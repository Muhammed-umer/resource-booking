import type { Metadata } from "next";

import { RefreshButton } from "@/components/refresh-button";
import { RequestTable } from "@/components/request-table";
import {
  getPendingBookings,
  getPendingGuestHouseBookings,
} from "@/lib/bookings/service";
import { bookingToRow, byNewestFirst, guestHouseToRow } from "@/lib/bookings/view";

export const metadata: Metadata = { title: "Overall Report" };

/**
 * The "Overall Report" link in the sidebar. Shows every request currently
 * waiting on an admin, across all three facilities, so users can see what else
 * is competing for the dates they want.
 */
export default async function WaitingRequestPage() {
  const [hallBookings, guestBookings] = await Promise.all([
    getPendingBookings(["SEMINAR_HALL", "AUDITORIUM"]),
    getPendingGuestHouseBookings(),
  ]);

  const rows = [
    ...hallBookings.map(bookingToRow),
    ...guestBookings.map(guestHouseToRow),
  ].sort(byNewestFirst);

  return (
    <div className="mx-auto w-full max-w-7xl px-2 pb-12 sm:px-4">
      <header className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3 sm:mt-4 sm:mb-8">
        <div>
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Overall report</h1>
        <p className="mt-2 text-gray-500">
          {rows.length === 0
            ? "No requests are waiting for a decision right now."
            : `${rows.length} request${rows.length === 1 ? "" : "s"} across all facilities are waiting for an admin decision.`}
        </p>
        </div>
        <RefreshButton />
      </header>

      <RequestTable
        rows={rows}
        showRequester
        emptyMessage="Nothing is pending. Approved and rejected requests appear in History."
      />
    </div>
  );
}
