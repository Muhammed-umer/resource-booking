"use client";

import { useActionState } from "react";

import { decideBookingAction } from "@/app/actions/bookings";
import { StatusBadge } from "@/components/status-badge";
import { FACILITY_LABEL } from "@/lib/facilities";
import {
  formatDateRange,
  formatTimeRange,
  type RequestRow,
} from "@/lib/bookings/view";

/** One pending request with approve / reject controls and an optional note. */
export function DecisionCard({ row }: { row: RequestRow }) {
  const [state, formAction, isPending] = useActionState(
    decideBookingAction,
    null,
  );

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800">{row.title}</h3>
            <StatusBadge status={row.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {FACILITY_LABEL[row.facilityType]} · {row.detail}
          </p>
        </div>
        <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 tabular-nums">
          #{row.id}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs tracking-wide text-gray-400 uppercase">
            Dates
          </dt>
          <dd className="mt-0.5 text-gray-700 tabular-nums">
            {formatDateRange(row.fromDate, row.toDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-gray-400 uppercase">
            Time
          </dt>
          <dd className="mt-0.5 text-gray-700 tabular-nums">
            {formatTimeRange(row.startTime, row.endTime)}
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-gray-400 uppercase">
            Requested by
          </dt>
          <dd className="mt-0.5 text-gray-700">{row.requestedByName}</dd>
        </div>
      </dl>

      <form action={formAction} className="mt-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="bookingId" value={row.id} />
        <input type="hidden" name="facilityType" value={row.facilityType} />

        <div className="w-full min-w-0 flex-1 sm:min-w-56">
          <label
            htmlFor={`adminMessage-${row.facilityType}-${row.id}`}
            className="mb-1 block text-xs tracking-wide text-gray-400 uppercase"
          >
            Note to requester (optional)
          </label>
          <input
            id={`adminMessage-${row.facilityType}-${row.id}`}
            name="adminMessage"
            type="text"
            maxLength={500}
            placeholder="e.g. Approved, collect the keys from the office"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <button
            type="submit"
            name="decision"
            value="APPROVE"
            disabled={isPending}
            className="flex-1 rounded-lg bg-success px-5 py-2 font-semibold text-white transition-transform hover:bg-success-dark active:scale-95 disabled:opacity-60 sm:flex-none"
          >
            Approve
          </button>
          <button
            type="submit"
            name="decision"
            value="REJECT"
            disabled={isPending}
            className="flex-1 rounded-lg bg-error px-5 py-2 font-semibold text-white transition-transform hover:bg-error-dark active:scale-95 disabled:opacity-60 sm:flex-none"
          >
            Reject
          </button>
        </div>
      </form>

      {state && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            state.ok
              ? "bg-success-light text-success-dark"
              : "bg-error-light text-error-dark"
          }`}
        >
          {state.message}
        </p>
      )}
    </li>
  );
}
