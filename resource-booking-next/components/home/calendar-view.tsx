"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { DayDetails } from "@/components/home/day-details";
import type {
  CalendarDayStatus,
  DayStatus,
  FacilityDay,
} from "@/lib/bookings/service";
import type { FacilityType } from "@/lib/db/schema";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarFilter = "ALL" | FacilityType;

const FILTERS: { value: CalendarFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "SEMINAR_HALL", label: "Seminar Hall" },
  { value: "GUEST_HOUSE", label: "Guest House" },
];

const DETAIL_KEY: Record<FacilityType, "seminarHall" | "auditorium" | "guestHouse"> = {
  SEMINAR_HALL: "seminarHall",
  AUDITORIUM: "auditorium",
  GUEST_HOUSE: "guestHouse",
};

const FACILITY_ROWS: { key: FacilityType; short: string; label: string }[] = [
  { key: "AUDITORIUM", short: "AUD", label: "Auditorium" },
  { key: "SEMINAR_HALL", short: "SH", label: "Seminar Hall" },
  { key: "GUEST_HOUSE", short: "GH", label: "Guest House" },
];

const FILL: Record<DayStatus, string> = {
  BOOKED: "bg-error",
  PENDING: "bg-pending",
  AVAILABLE: "",
};

const RING: Record<DayStatus, string> = {
  BOOKED: "border-error",
  PENDING: "border-pending",
  AVAILABLE: "border-gray-300",
};

const WORD: Record<DayStatus, string> = {
  BOOKED: "booked",
  PENDING: "awaiting approval",
  AVAILABLE: "free",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function monthBounds(year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    startDate: toISO(year, month, 1),
    endDate: toISO(year, month, lastDay),
    lastDay,
    firstWeekday: new Date(Date.UTC(year, month, 1)).getUTCDay(),
  };
}

/** Plain-language description for tooltips and screen readers. */
function describe(day: FacilityDay): string {
  if (day.status === "AVAILABLE") return "free";
  if (day.morning === day.afternoon) return `${WORD[day.morning]} all day`;
  return `morning ${WORD[day.morning]}, afternoon ${WORD[day.afternoon]}`;
}

/**
 * A circle split at noon: the left half is the morning, the right half the
 * afternoon. Full circle = whole day; one half = that half only. Red is
 * booked, amber is awaiting approval.
 */
function HalfDayCircle({
  day,
  className,
}: {
  day: FacilityDay;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 overflow-hidden rounded-full border-2 bg-white ${RING[day.status]} ${className}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1/2 ${FILL[day.morning]}`} />
      <span className={`absolute inset-y-0 right-0 w-1/2 ${FILL[day.afternoon]}`} />
    </span>
  );
}

const LEGEND_SHAPES: { label: string; day: FacilityDay }[] = [
  { label: "Whole day", day: { status: "BOOKED", morning: "BOOKED", afternoon: "BOOKED" } },
  { label: "Morning", day: { status: "BOOKED", morning: "BOOKED", afternoon: "AVAILABLE" } },
  { label: "Afternoon", day: { status: "BOOKED", morning: "AVAILABLE", afternoon: "BOOKED" } },
];

/**
 * Month grid backed by the calendar endpoint.
 *
 * "All" lists each facility with something on that day. Picking a facility
 * shows one large circle per day for it. Free days stay plain. Clicking a day
 * opens the bookings behind it.
 */
export function CalendarView({
  initialDays,
  initialYear,
  initialMonth,
  initialFilter = "ALL",
}: {
  initialDays: CalendarDayStatus[];
  initialYear: number;
  initialMonth: number;
  initialFilter?: CalendarFilter;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [filter, setFilter] = useState<CalendarFilter>(initialFilter);
  const [days, setDays] = useState(initialDays);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const closeDetails = useCallback(() => setSelectedDate(null), []);

  const isInitialMonth = year === initialYear && month === initialMonth;

  useEffect(() => {
    if (isInitialMonth) {
      setDays(initialDays);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { startDate, endDate } = monthBounds(year, month);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/calendar?startDate=${startDate}&endDate=${endDate}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(await response.text());
        setDays((await response.json()) as CalendarDayStatus[]);
        setError(null);
      } catch {
        if (controller.signal.aborted) return;
        setError("Could not load this month. Check your connection and retry.");
      }
    });

    return () => controller.abort();
  }, [year, month, isInitialMonth, initialDays]);

  const { lastDay, firstWeekday } = monthBounds(year, month);
  const byDate = new Map(days.map((day) => [day.date, day]));
  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const shift = (delta: number) => {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  };

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const selected = filter === "ALL" ? null : filter;
  const selectedDay = selectedDate ? byDate.get(selectedDate) : undefined;

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5 md:p-8">
      {/* Filter: which facility to look at */}
      <div role="group" aria-label="Facility" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                active
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 md:text-xl">
          {monthLabel}
          {isPending && (
            <span className="ml-3 text-sm font-normal text-gray-400">loading…</span>
          )}
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-light px-4 py-3 text-sm text-error-dark">
          {error}
        </p>
      )}

      <div className="mb-3 grid grid-cols-7 text-center text-[11px] font-semibold tracking-wide text-gray-400 uppercase sm:text-xs md:text-sm">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
        {Array.from({ length: firstWeekday }, (_, index) => (
          <div
            key={`pad-${index}`}
            className="h-12 rounded-lg bg-gray-50/50 sm:h-16 md:h-24 md:rounded-xl"
          />
        ))}

        {Array.from({ length: lastDay }, (_, index) => {
          const dayNumber = index + 1;
          const iso = toISO(year, month, dayNumber);
          const status = byDate.get(iso);
          const isToday = iso === todayISO;
          const isPast = iso < todayISO;

          const single = selected && status ? status[DETAIL_KEY[selected]] : null;
          const showSingle = single !== null && single.status !== "AVAILABLE";

          const title = single
            ? `${dayNumber} ${monthLabel}: ${describe(single)}`
            : status
              ? FACILITY_ROWS.filter((row) => status[DETAIL_KEY[row.key]].status !== "AVAILABLE")
                  .map((row) => `${row.label}: ${describe(status[DETAIL_KEY[row.key]])}`)
                  .join(" · ") || undefined
              : undefined;

          return (
            <button
              key={iso}
              type="button"
              title={title}
              aria-label={`${dayNumber} ${monthLabel}${title ? `: ${title}` : ""}. Show details`}
              onClick={() => setSelectedDate(iso)}
              disabled={!status}
              className={`relative flex h-12 flex-col rounded-lg border border-gray-100 bg-white p-1 text-left transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default sm:h-16 md:h-24 md:rounded-xl md:p-2 ${
                isToday ? "ring-2 ring-primary" : ""
              } ${isPast ? "opacity-55" : ""}`}
            >
              <span
                className={`text-[11px] font-semibold sm:text-xs md:text-sm ${
                  isToday ? "text-primary" : "text-gray-700"
                }`}
              >
                {dayNumber}
              </span>

              {showSingle && (
                <span className="flex flex-1 items-center justify-center">
                  <HalfDayCircle
                    day={single}
                    className="h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9"
                  />
                  <span className="sr-only">{describe(single)}</span>
                </span>
              )}

              {!selected && status && (
                <ul className="mt-0.5 flex flex-col gap-0.5 md:mt-1 md:gap-1">
                  {FACILITY_ROWS.map((row) => {
                    const day = status[DETAIL_KEY[row.key]];
                    if (day.status === "AVAILABLE") return null;
                    return (
                      <li key={row.key} className="flex items-center gap-1">
                        <HalfDayCircle day={day} className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span className="hidden text-[10px] leading-none font-medium text-gray-500 md:inline">
                          {row.short}
                        </span>
                        <span className="sr-only">
                          {row.label}: {describe(day)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        {LEGEND_SHAPES.map((shape) => (
          <div key={shape.label} className="flex items-center gap-1.5">
            <HalfDayCircle day={shape.day} className="h-4 w-4" />
            <dd>{shape.label}</dd>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-error" />
          <dd>Booked</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-pending" />
          <dd>Awaiting approval</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary" />
          <dd>Today</dd>
        </div>
        <div className="basis-full text-gray-400">
          Click any day to see who has booked it.
          {!selected && " AUD · SH · GH — pick a facility above to see its days at full size."}
        </div>
      </dl>

      {selectedDay && (
        <DayDetails day={selectedDay} facility={selected} onClose={closeDetails} />
      )}
    </section>
  );
}
