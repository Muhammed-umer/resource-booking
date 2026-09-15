"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createRequestAction, type ActionResult } from "@/app/actions/bookings";
import { TimeField } from "@/components/home/time-field";
import { countDays, formatDayLabel, formatLongDate, formatTime12h } from "@/lib/bookings/view";
import type { Department } from "@/lib/db/schema";
import { FACILITY_OPTIONS, type BookableFacility } from "@/lib/facilities";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary";

const lockedClass =
  "w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600";

type DayRow = { key: number; date: string; startTime: string; endTime: string };

let nextKey = 1;

/** The day after `iso`, as YYYY-MM-DD. */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Today's date in the browser's local timezone, as YYYY-MM-DD. */
function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function BookingModal({
  isOpen,
  facilityType,
  facilityLocked,
  department,
  onFacilityChange,
  onClose,
  onResult,
}: {
  isOpen: boolean;
  facilityType: BookableFacility | "";
  /** True when opened from a resource card: the facility cannot be changed. */
  facilityLocked: boolean;
  /**
   * The signed-in account's department. Shown read-only; the server files the
   * request under this regardless of anything the form sends.
   */
  department: Department | null;
  onFacilityChange: (facility: BookableFacility | "") => void;
  onClose: () => void;
  onResult: (result: ActionResult) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    createRequestAction,
    null,
  );
  const handledRef = useRef<ActionResult | null>(null);

  // Form state mirrored here only to drive the live summary and the date
  // limits; the server still validates everything from the submitted fields.
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  // Multi-day hall requests: one entry per day, each with its own hours.
  const [days, setDays] = useState<DayRow[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFromDate("");
      setToDate("");
      setMultiDay(false);
      setStartTime("");
      setEndTime("");
      setDays([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (state && handledRef.current !== state) {
      handledRef.current = state;
      onResult(state);
    }
  }, [state, onResult]);

  if (!isOpen) return null;

  const isGuestHouse = facilityType === "GUEST_HOUSE";
  const today = todayISO();
  const needsDepartment = facilityType !== "" && !isGuestHouse;
  const missingDepartment = needsDepartment && !department;

  // Halls, single day: submits toDate = fromDate. Halls, multiple days: the
  // day list is submitted as JSON in `slots`. Guest house: check-in/out dates.
  const hallMultiDay = !isGuestHouse && multiDay;
  const showToDate = isGuestHouse;
  const effectiveToDate = showToDate ? toDate : fromDate;
  const spanDays =
    fromDate && effectiveToDate && effectiveToDate >= fromDate
      ? countDays(fromDate, effectiveToDate)
      : 0;
  const timeOrder = startTime && endTime ? (startTime < endTime ? "ok" : "bad") : "incomplete";

  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const dayProblems = sortedDays.map((row, i) => {
    if (!row.date) return "Pick a date.";
    if (row.date < today) return "That date has passed.";
    if (i > 0 && sortedDays[i - 1].date === row.date) return "Same day listed twice.";
    if (!row.startTime || !row.endTime) return "Pick start and end times.";
    if (row.startTime >= row.endTime) return "End time must be after start time.";
    return null;
  });
  const daysValid = days.length > 0 && dayProblems.every((p) => p === null);
  const slotsJSON = daysValid
    ? JSON.stringify(sortedDays.map(({ date, startTime, endTime }) => ({ date, startTime, endTime })))
    : "";

  const addDay = () => {
    const last = sortedDays[sortedDays.length - 1];
    setDays((current) => [
      ...current,
      {
        key: nextKey++,
        date: last?.date ? nextDay(last.date) : "",
        startTime: last?.startTime ?? "",
        endTime: last?.endTime ?? "",
      },
    ]);
  };
  const updateDay = (key: number, patch: Partial<DayRow>) =>
    setDays((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const removeDay = (key: number) => setDays((current) => current.filter((row) => row.key !== key));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-fade-in no-scrollbar relative z-10 max-h-[92vh] w-full max-w-lg overflow-x-hidden overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between bg-primary px-6 py-4 text-white shadow-md">
          <h3 id="booking-modal-title" className="text-lg font-semibold">
            Book{" "}
            {FACILITY_OPTIONS.find((f) => f.value === facilityType)?.label ??
              "a resource"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none hover:text-gray-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form action={formAction} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="facilityType"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Resource type
            </label>
            {facilityLocked && facilityType !== "" ? (
              <>
                {/* A disabled <select> is not submitted, so carry the value in a hidden input. */}
                <input type="hidden" name="facilityType" value={facilityType} />
                <input
                  id="facilityType"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  aria-readonly="true"
                  value={
                    FACILITY_OPTIONS.find((f) => f.value === facilityType)?.label ??
                    facilityType
                  }
                  className={lockedClass}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Set by the card you clicked. Close this and pick another card
                  to change it.
                </p>
              </>
            ) : (
              <select
                id="facilityType"
                name="facilityType"
                required
                value={facilityType}
                onChange={(event) =>
                  onFacilityChange(event.target.value as BookableFacility | "")
                }
                className={inputClass}
              >
                <option value="" disabled>
                  Select a resource…
                </option>
                {FACILITY_OPTIONS.map((facility) => (
                  <option key={facility.value} value={facility.value}>
                    {facility.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isGuestHouse && (
            <>
              <div>
                <label
                  htmlFor="eventName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Event name
                </label>
                <input
                  id="eventName"
                  name="eventName"
                  type="text"
                  required
                  placeholder="e.g. Annual Day"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  aria-readonly="true"
                  value={department ?? "Not set on your account"}
                  className={lockedClass}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {department
                    ? "Fixed to the department you signed in as."
                    : "Your account has no department, so it cannot book halls. Contact the office."}
                </p>
              </div>
            </>
          )}

          {isGuestHouse && (
            <>
              <div>
                <label
                  htmlFor="guestName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Guest name
                </label>
                <input
                  id="guestName"
                  name="guestName"
                  type="text"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Phone number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="roomNumber"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Room number
                  </label>
                  <input
                    id="roomNumber"
                    name="roomNumber"
                    type="number"
                    min={1}
                    defaultValue={1}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {!isGuestHouse && (
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Duration</span>
              <div role="radiogroup" aria-label="Duration" className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
                {[
                  { value: false, label: "Single day" },
                  { value: true, label: "Multiple days" },
                ].map((option) => {
                  const active = multiDay === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setMultiDay(option.value);
                        if (option.value && days.length === 0) {
                          setDays([{ key: nextKey++, date: fromDate, startTime, endTime }]);
                        }
                      }}
                      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                        active ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!hallMultiDay && (
          <div className={`grid grid-cols-1 gap-4 ${showToDate ? "sm:grid-cols-2" : ""}`}>
            <div>
              <label
                htmlFor="fromDate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {isGuestHouse ? "Check-in date" : "Date"}
              </label>
              <input
                id="fromDate"
                name="fromDate"
                type="date"
                required
                min={today}
                value={fromDate}
                onChange={(event) => {
                  const next = event.target.value;
                  setFromDate(next);
                  if (toDate && toDate < next) setToDate(next);
                }}
                className={inputClass}
              />
            </div>
            {showToDate ? (
              <div>
                <label
                  htmlFor="toDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Check-out date
                </label>
                <input
                  id="toDate"
                  name="toDate"
                  type="date"
                  required
                  min={fromDate || today}
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              // Single day: the server still receives a full range.
              <input type="hidden" name="toDate" value={fromDate} />
            )}
          </div>
          )}

          {!hallMultiDay && (
          <div>
            {!isGuestHouse && (
              <p className="mb-2 text-xs text-gray-500">Hours the hall is reserved on that day.</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TimeField
                key={isGuestHouse ? "checkInTime" : "startTime"}
                id={isGuestHouse ? "checkInTime" : "startTime"}
                name={isGuestHouse ? "checkInTime" : "startTime"}
                label={isGuestHouse ? "Check-in time" : "Start time"}
                required={!isGuestHouse}
                onChange={setStartTime}
              />
              <TimeField
                key={isGuestHouse ? "checkOutTime" : "endTime"}
                id={isGuestHouse ? "checkOutTime" : "endTime"}
                name={isGuestHouse ? "checkOutTime" : "endTime"}
                label={isGuestHouse ? "Check-out time" : "End time"}
                required={!isGuestHouse}
                onChange={setEndTime}
              />
            </div>
            {!isGuestHouse && timeOrder === "bad" && (
              <p role="alert" className="mt-2 text-xs text-error-dark">
                End time must be after start time. For an event that runs past midnight, book each day separately.
              </p>
            )}
          </div>
          )}

          {hallMultiDay && (
            <div>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Days and hours</span>
                  <p className="text-xs text-gray-500">Each day has its own start and end time.</p>
                </div>
                <button
                  type="button"
                  onClick={addDay}
                  className="shrink-0 rounded-lg border border-primary/40 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                >
                  + Add a day
                </button>
              </div>

              {days.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                  No days yet. Use “Add a day” to list each day you need.
                </p>
              )}

              <ol className="flex flex-col gap-3">
                {sortedDays.map((row, index) => {
                  const problem = dayProblems[index];
                  return (
                    <li
                      key={row.key}
                      className="rounded-xl border border-gray-200 bg-gray-50/60 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                          Day {index + 1}
                          {row.date && (
                            <span className="ml-2 font-normal normal-case text-gray-400">{formatDayLabel(row.date)}</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDay(row.key)}
                          aria-label={`Remove day ${index + 1}`}
                          className="rounded px-2 py-0.5 text-xs font-semibold text-gray-400 hover:bg-error-light hover:text-error-dark"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.3fr_1.3fr]">
                        <div>
                          <label htmlFor={`day-${row.key}-date`} className="mb-1 block text-xs font-medium text-gray-600">
                            Date
                          </label>
                          <input
                            id={`day-${row.key}-date`}
                            type="date"
                            min={today}
                            value={row.date}
                            onChange={(event) => updateDay(row.key, { date: event.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <TimeField
                          id={`day-${row.key}-start`}
                          label="Start"
                          defaultValue={row.startTime}
                          onChange={(value) => updateDay(row.key, { startTime: value })}
                        />
                        <TimeField
                          id={`day-${row.key}-end`}
                          label="End"
                          defaultValue={row.endTime}
                          onChange={(value) => updateDay(row.key, { endTime: value })}
                        />
                      </div>
                      {problem && (
                        <p role="alert" className="mt-2 text-xs text-error-dark">{problem}</p>
                      )}
                    </li>
                  );
                })}
              </ol>

              {/* The whole list travels as one field; the server validates every day again. */}
              <input type="hidden" name="slots" value={slotsJSON} />
            </div>
          )}

          {/* Live summary: a multi-day request reads back day by day. */}
          {hallMultiDay && daysValid && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-700">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                You are requesting · {sortedDays.length} day{sortedDays.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {sortedDays.map((row) => (
                  <li key={row.key} className="flex justify-between gap-3 tabular-nums">
                    <span className="font-semibold">{formatLongDate(row.date)}</span>
                    <span>
                      {formatTime12h(row.startTime)} – {formatTime12h(row.endTime)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-gray-500">The hall is not held overnight between days.</p>
            </div>
          )}

          {!hallMultiDay && spanDays > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-700">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">You are requesting</p>
              {isGuestHouse ? (
                <p className="mt-1">
                  <span className="font-semibold">{formatLongDate(fromDate)}</span>
                  {spanDays > 1 && (
                    <>
                      {" "}to <span className="font-semibold">{formatLongDate(effectiveToDate)}</span>
                      <span className="text-gray-500"> · {spanDays - 1} night{spanDays - 1 === 1 ? "" : "s"}</span>
                    </>
                  )}
                  {spanDays === 1 && <span className="text-gray-500"> · check-out is the same day</span>}
                </p>
              ) : (
                <>
                  <p className="mt-1">
                    <span className="font-semibold">{formatLongDate(fromDate)}</span>
                  </p>
                  {startTime && endTime && timeOrder === "ok" && (
                    <p className="mt-0.5">
                      <span className="font-semibold">
                        {formatTime12h(startTime)} – {formatTime12h(endTime)}
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {isGuestHouse && (
            <div>
              <label
                htmlFor="purpose"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Purpose of visit
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows={2}
                className={inputClass}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || facilityType === "" || missingDepartment || (hallMultiDay && !daysValid)}
            className="mt-4 w-full rounded-lg bg-primary py-3 font-bold text-white shadow-lg transition-transform hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Sending request…" : "Confirm booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
