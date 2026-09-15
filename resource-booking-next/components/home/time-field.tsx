"use client";

import { useState } from "react";

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const selectClass =
  "min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 outline-none focus:ring-2 focus:ring-primary";

/**
 * 12-hour time picker: hour · minute · AM/PM. The native <input type="time">
 * follows the browser locale, so it shows 24-hour on most Indian/UK setups —
 * this always reads as AM/PM. Submits `HH:MM` (24-hour) in a hidden input, which
 * is what the server validates, so nothing else changes.
 */
export function TimeField({
  id,
  name,
  label,
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
}) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  let value = "";
  if (hour !== "") {
    const h = Number(hour);
    const h24 = period === "AM" ? h % 12 : (h % 12) + 12;
    value = `${String(h24).padStart(2, "0")}:${minute}`;
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          id={id}
          aria-label={`${label} hour`}
          required={required}
          value={hour}
          onChange={(event) => setHour(event.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            Hour
          </option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <select
          aria-label={`${label} minute`}
          value={minute}
          onChange={(event) => setMinute(event.target.value)}
          className={selectClass}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          aria-label={`${label} AM or PM`}
          value={period}
          onChange={(event) => setPeriod(event.target.value as "AM" | "PM")}
          className={selectClass}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
