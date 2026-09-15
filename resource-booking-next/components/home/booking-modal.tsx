"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createRequestAction, type ActionResult } from "@/app/actions/bookings";
import { TimeField } from "@/components/home/time-field";
import type { Department } from "@/lib/db/schema";
import { FACILITY_OPTIONS, type BookableFacility } from "@/lib/facilities";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary";

const lockedClass =
  "w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600";

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

  // Tracks the chosen start date so the end date cannot precede it.
  const [fromDate, setFromDate] = useState("");

  useEffect(() => {
    if (isOpen) setFromDate("");
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="fromDate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {isGuestHouse ? "Check-in date" : "From date"}
              </label>
              <input
                id="fromDate"
                name="fromDate"
                type="date"
                required
                min={today}
                onChange={(event) => setFromDate(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="toDate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {isGuestHouse ? "Check-out date" : "To date"}
              </label>
              <input
                id="toDate"
                name="toDate"
                type="date"
                required
                min={fromDate || today}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimeField
              key={isGuestHouse ? "checkInTime" : "startTime"}
              id={isGuestHouse ? "checkInTime" : "startTime"}
              name={isGuestHouse ? "checkInTime" : "startTime"}
              label={isGuestHouse ? "Check-in time" : "Start time"}
              required={!isGuestHouse}
            />
            <TimeField
              key={isGuestHouse ? "checkOutTime" : "endTime"}
              id={isGuestHouse ? "checkOutTime" : "endTime"}
              name={isGuestHouse ? "checkOutTime" : "endTime"}
              label={isGuestHouse ? "Check-out time" : "End time"}
              required={!isGuestHouse}
            />
          </div>

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
            disabled={isPending || facilityType === "" || missingDepartment}
            className="mt-4 w-full rounded-lg bg-primary py-3 font-bold text-white shadow-lg transition-transform hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Sending request…" : "Confirm booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
