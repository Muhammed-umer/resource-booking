import { CalendarView, type CalendarFilter } from "@/components/home/calendar-view";
import { getCalendarStatus } from "@/lib/bookings/service";
import { facilityTypeSchema } from "@/lib/validation";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * The Availability Radar page body, shared by the user and admin areas.
 * `facility` (from ?facility=AUDITORIUM etc.) pre-selects the filter.
 */
export async function AvailabilityBoard({ facility }: { facility?: string }) {
  const parsed = facilityTypeSchema.safeParse(facility?.toUpperCase());
  const initialFilter: CalendarFilter = parsed.success ? parsed.data : "ALL";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = await getCalendarStatus(
    `${year}-${pad(month + 1)}-01`,
    `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-2 pb-12 sm:px-4">
      <header className="mt-2 mb-6 sm:mt-4 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Availability Radar
        </h1>
        <p className="mt-2 text-gray-500">
          See which days the Auditorium, Seminar Hall or Guest House are booked,
          waiting on approval, or free. Pick a facility to colour the whole
          month, and click a day to see who booked it.
        </p>
      </header>

      <CalendarView
        initialDays={days}
        initialYear={year}
        initialMonth={month}
        initialFilter={initialFilter}
      />
    </div>
  );
}
