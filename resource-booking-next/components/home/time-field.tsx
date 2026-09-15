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
function split(value?: string): { hour: string; minute: string; period: "AM" | "PM" } {
  if (!value) return { hour: "", minute: "00", period: "AM" };
  const [h, m = "00"] = value.split(":");
  const h24 = Number(h);
  return {
    hour: String(h24 % 12 === 0 ? 12 : h24 % 12),
    minute: m.slice(0, 2),
    period: h24 >= 12 ? "PM" : "AM",
  };
}

export function TimeField({
  id,
  name,
  label,
  required = true,
  defaultValue,
  onChange,
}: {
  id: string;
  /** Form field name for the hidden `HH:MM` input. Omit to keep the value out of the form. */
  name?: string;
  label: string;
  required?: boolean;
  /** Initial 24-hour `HH:MM` value. */
  defaultValue?: string;
  /** Called with the 24-hour `HH:MM` value ("" until an hour is chosen). */
  onChange?: (value: string) => void;
}) {
  const initial = split(defaultValue);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);

  let value = "";
  if (hour !== "") {
    const h = Number(hour);
    const h24 = period === "AM" ? h % 12 : (h % 12) + 12;
    value = `${String(h24).padStart(2, "0")}:${minute}`;
  }

  const update = (next: { hour?: string; minute?: string; period?: "AM" | "PM" }) => {
    const nh = next.hour ?? hour;
    const nm = next.minute ?? minute;
    const np = next.period ?? period;
    if (next.hour !== undefined) setHour(nh);
    if (next.minute !== undefined) setMinute(nm);
    if (next.period !== undefined) setPeriod(np);
    if (!onChange) return;
    if (nh === "") return onChange("");
    const h = Number(nh);
    const h24 = np === "AM" ? h % 12 : (h % 12) + 12;
    onChange(`${String(h24).padStart(2, "0")}:${nm}`);
  };

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
          onChange={(event) => update({ hour: event.target.value })}
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
          onChange={(event) => update({ minute: event.target.value })}
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
          onChange={(event) => update({ period: event.target.value as "AM" | "PM" })}
          className={selectClass}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
