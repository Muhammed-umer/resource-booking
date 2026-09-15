"use client";

import { useEffect } from "react";

import { StatusBadge } from "@/components/status-badge";
import type { CalendarDayStatus, CalendarEntry } from "@/lib/bookings/service";
import { countDays, formatSchedule, formatTimeRange } from "@/lib/bookings/view";
import type { FacilityType } from "@/lib/db/schema";
import { FACILITY_LABEL } from "@/lib/facilities";

const FACILITY_TONE: Record<FacilityType, string> = {
  AUDITORIUM: "bg-primary/10 text-primary",
  SEMINAR_HALL: "bg-sky-100 text-sky-700",
  GUEST_HOUSE: "bg-violet-100 text-violet-700",
};

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function EntryCard({ entry, date }: { entry: CalendarEntry; date: string }) {
  const isGuestHouse = entry.facilityType === "GUEST_HOUSE";
  const spansDays = entry.fromDate !== entry.toDate;
  const schedule = formatSchedule(entry);
  const dayIndex = countDays(entry.fromDate, date);
  // For halls the entry's start/end are this day's own hours.
  const time = isGuestHouse
    ? schedule.time === "—" ? "Whole day" : schedule.time
    : entry.startTime && entry.endTime
      ? `${formatTimeRange(entry.startTime, entry.endTime)}${spansDays ? " on this day" : ""}`
      : "—";

  return (
    <li className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${FACILITY_TONE[entry.facilityType]}`}
        >
          {FACILITY_LABEL[entry.facilityType]}
        </span>
        <StatusBadge status={entry.status === "BOOKED" ? "APPROVED" : "PENDING"} />
      </div>

      <p className="mt-3 text-base font-semibold text-gray-800">{entry.title}</p>

      <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-gray-400">
            {isGuestHouse ? "Purpose" : "Department"}
          </dt>
          <dd className="font-medium text-gray-700">{entry.detail}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-gray-400">
            {isGuestHouse ? "Times" : "Time"}
          </dt>
          <dd className="font-medium text-gray-700">{time}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-gray-400">Dates</dt>
          <dd className="font-medium text-gray-700">
            {schedule.dates}
            {spansDays && (
              <span className="ml-1 text-xs font-normal text-gray-400">
                (day {dayIndex} of {countDays(entry.fromDate, entry.toDate)})
              </span>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-gray-400">Requested by</dt>
          <dd className="font-medium text-gray-700">{entry.requestedByName}</dd>
        </div>
      </dl>
    </li>
  );
}

/**
 * What is booked on one day. Opens when a day in the Radar is clicked; filtered
 * to one facility when the Radar filter is set. Bottom sheet on phones,
 * centred dialog on larger screens.
 */
export function DayDetails({
  day,
  facility,
  onClose,
}: {
  day: CalendarDayStatus;
  facility: FacilityType | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const entries = facility
    ? day.entries.filter((entry) => entry.facilityType === facility)
    : day.entries;

  const scope = facility ? FACILITY_LABEL[facility] : "All facilities";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-details-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="day-details-title" className="text-lg font-bold text-gray-800">
              {longDate(day.date)}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {scope} ·{" "}
              {entries.length === 0
                ? "nothing booked"
                : `${entries.length} booking${entries.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          {entries.length === 0 ? (
            <p className="rounded-2xl bg-success-light px-4 py-6 text-center text-sm font-medium text-success-dark">
              {facility ? `The ${FACILITY_LABEL[facility]} is free on this day.` : "Nothing is booked on this day."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {entries.map((entry) => (
                <EntryCard key={`${entry.facilityType}-${entry.id}`} entry={entry} date={day.date} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
