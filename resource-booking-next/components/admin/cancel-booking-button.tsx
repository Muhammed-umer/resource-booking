"use client";

import { useActionState, useEffect, useId, useState } from "react";

import { cancelBookingAction } from "@/app/actions/bookings";
import { FACILITY_LABEL } from "@/lib/facilities";
import { formatSchedule, type RequestRow } from "@/lib/bookings/view";

/**
 * "Cancel" for an approved booking. Opens a confirmation box that repeats what
 * is being cancelled and takes an optional reason, then submits. The slot is
 * free again as soon as the action succeeds.
 */
export function CancelBookingButton({ row }: { row: RequestRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(cancelBookingAction, null);
  const reasonId = useId();
  const schedule = formatSchedule(row);

  // Close the box once the cancellation went through; the list re-renders
  // with the new status and the button disappears with it.
  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-error/40 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      >
        Cancel booking
      </button>

      {state && !state.ok && !open && (
        <p role="alert" className="mt-2 text-xs text-error-dark">
          {state.message}
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${reasonId}-title`}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-3xl sm:p-6"
          >
            <h2 id={`${reasonId}-title`} className="text-lg font-bold text-gray-800">
              Cancel this booking?
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              The {FACILITY_LABEL[row.facilityType]} will be free again for these
              dates and the requester will see it as cancelled.
            </p>

            <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-800">{row.title}</p>
              <p className="text-gray-500">
                {row.detail} · {row.requestedByName}
              </p>
              <p className="mt-1 text-gray-700 tabular-nums">
                {schedule.dates}
                {!schedule.showPerDay && schedule.time !== "—" && <> · {schedule.time}</>}
              </p>
              {schedule.showPerDay && (
                <ul className="mt-1 flex flex-col gap-0.5 text-gray-600 tabular-nums">
                  {schedule.perDay.map((line) => (
                    <li key={line.date}>
                      <span className="inline-block w-20 text-gray-400">{line.day}</span>
                      {line.time}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form action={formAction} className="mt-4">
              <input type="hidden" name="bookingId" value={row.id} />
              <input type="hidden" name="facilityType" value={row.facilityType} />

              <label htmlFor={reasonId} className="mb-1 block text-xs tracking-wide text-gray-400 uppercase">
                Reason (optional)
              </label>
              <textarea
                id={reasonId}
                name="reason"
                rows={3}
                maxLength={500}
                placeholder="e.g. Hall needed for the college function that day"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              {state && !state.ok && (
                <p role="alert" className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error-dark">
                  {state.message}
                </p>
              )}

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  Keep booking
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-error px-5 py-2 font-semibold text-white transition-transform hover:bg-error-dark active:scale-95 disabled:opacity-60"
                >
                  {isPending ? "Cancelling…" : "Yes, cancel booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
