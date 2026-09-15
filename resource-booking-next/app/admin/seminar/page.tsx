import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ApprovalQueue } from "@/components/admin/approval-queue";
import { RefreshButton } from "@/components/refresh-button";
import { RequestTable } from "@/components/request-table";
import { getSessionUser } from "@/lib/auth/roles";
import {
  getBookingsByFacility,
  getPendingBookings,
} from "@/lib/bookings/service";
import { bookingToRow, byNewestFirst } from "@/lib/bookings/view";

export const metadata: Metadata = { title: "Seminar Hall requests" };

export default async function SeminarAdminPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");
  if (sessionUser.role !== "ADMIN_SEMINAR") redirect("/admin");

  const [pending, all] = await Promise.all([
    getPendingBookings(["SEMINAR_HALL"]),
    getBookingsByFacility("SEMINAR_HALL"),
  ]);

  const decided = all
    .filter((booking) => booking.bookingStatus !== "PENDING")
    .map(bookingToRow)
    .sort(byNewestFirst);

  return (
    <div className="mx-auto w-full max-w-6xl px-2 pb-12 sm:px-4">
      <header className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3 sm:mt-4 sm:mb-8">
        <div>
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Seminar Hall requests
        </h1>
        <p className="mt-2 text-gray-500">
          {pending.length === 0
            ? "Nothing is waiting for your decision."
            : `${pending.length} request${pending.length === 1 ? "" : "s"} waiting for your decision.`}
        </p>
        </div>
        <RefreshButton />
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-gray-700">Pending</h2>
        <ApprovalQueue
          rows={pending.map(bookingToRow)}
          emptyMessage="The queue is clear. New seminar hall requests will appear here."
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-700">Already decided</h2>
        <RequestTable
          rows={decided}
          showRequester
          cancellable
          emptyMessage="You have not approved, rejected or cancelled any seminar hall requests yet."
        />
      </section>
    </div>
  );
}
