import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ApprovalQueue } from "@/components/admin/approval-queue";
import { RefreshButton } from "@/components/refresh-button";
import { RequestTable } from "@/components/request-table";
import { getSessionUser } from "@/lib/auth/roles";
import {
  getAllGuestHouseBookings,
  getPendingGuestHouseBookings,
} from "@/lib/bookings/service";
import { byNewestFirst, guestHouseToRow } from "@/lib/bookings/view";

export const metadata: Metadata = { title: "Guest House requests" };

export default async function GuestHouseAdminPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");
  if (sessionUser.role !== "ADMIN_RESOURCE") redirect("/admin");

  const [pending, all] = await Promise.all([
    getPendingGuestHouseBookings(),
    getAllGuestHouseBookings(),
  ]);

  const decided = all
    .filter((booking) => booking.status !== "PENDING")
    .map(guestHouseToRow)
    .sort(byNewestFirst);

  return (
    <div className="mx-auto w-full max-w-6xl px-2 pb-12 sm:px-4">
      <header className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3 sm:mt-4 sm:mb-8">
        <div>
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Guest House requests
        </h1>
        <p className="mt-2 text-gray-500">
          {pending.length === 0
            ? "No room requests are waiting for your decision."
            : `${pending.length} room request${pending.length === 1 ? "" : "s"} waiting for your decision.`}
        </p>
        </div>
        <RefreshButton />
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-gray-700">Pending</h2>
        <ApprovalQueue
          rows={pending.map(guestHouseToRow)}
          emptyMessage="The queue is clear. New room requests will appear here."
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-700">Already decided</h2>
        <RequestTable
          rows={decided}
          showRequester
          cancellable
          emptyMessage="You have not approved, rejected or cancelled any room requests yet."
        />
      </section>
    </div>
  );
}
