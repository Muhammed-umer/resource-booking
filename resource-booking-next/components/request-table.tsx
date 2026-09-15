import { CancelBookingButton } from "@/components/admin/cancel-booking-button";
import { StatusBadge } from "@/components/status-badge";
import { FACILITY_LABEL } from "@/lib/facilities";
import { formatSchedule, type RequestRow } from "@/lib/bookings/view";

/**
 * List of requests, used by History, the Overall Report and the admins'
 * "already decided" lists. A table from `md` up; stacked cards below that, so
 * nothing has to scroll sideways on a phone. With `cancellable`, approved rows
 * get a Cancel control (admin lists only).
 */
export function RequestTable({
  rows,
  emptyMessage,
  showRequester = false,
  cancellable = false,
}: {
  rows: RequestRow[];
  emptyMessage: string;
  showRequester?: boolean;
  cancellable?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Phones and small tablets */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const schedule = formatSchedule(row);
          return (
          <li
            key={`${row.facilityType}-${row.id}`}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {FACILITY_LABEL[row.facilityType]}
                </div>
                <div className="mt-0.5 font-semibold text-gray-800">{row.title}</div>
                <div className="text-sm text-gray-500">{row.detail}</div>
              </div>
              <StatusBadge status={row.status} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-gray-400">Dates</dt>
                <dd className="text-gray-700 tabular-nums">{schedule.dates}</dd>
              </div>
              <div className={schedule.showPerDay ? "col-span-2" : ""}>
                <dt className="text-xs text-gray-400">Time</dt>
                <dd className="text-gray-700 tabular-nums">
                  {schedule.showPerDay ? (
                    <ul className="mt-0.5 flex flex-col gap-0.5">
                      {schedule.perDay.map((line) => (
                        <li key={line.date} className="flex justify-between gap-3">
                          <span className="text-gray-500">{line.day}</span>
                          <span>{line.time}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    schedule.time
                  )}
                </dd>
              </div>
              {showRequester && (
                <div>
                  <dt className="text-xs text-gray-400">Requested by</dt>
                  <dd className="text-gray-700">{row.requestedByName}</dd>
                </div>
              )}
              {row.decidedBy && (
                <div>
                  <dt className="text-xs text-gray-400">Decided by</dt>
                  <dd className="text-gray-700">{row.decidedBy}</dd>
                </div>
              )}
            </dl>

            {row.adminMessage && (
              <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 italic">
                Admin note: {row.adminMessage}
              </p>
            )}

            {cancellable && row.status === "APPROVED" && (
              <div className="mt-3">
                <CancelBookingButton row={row} />
              </div>
            )}
          </li>
          );
        })}
      </ul>

      {/* Tablets and up */}
      <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Facility</th>
              <th scope="col" className="px-4 py-3 font-semibold">Request</th>
              {showRequester && (
                <th scope="col" className="px-4 py-3 font-semibold">Requested by</th>
              )}
              <th scope="col" className="px-4 py-3 font-semibold">Dates</th>
              <th scope="col" className="px-4 py-3 font-semibold">Time</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              {cancellable && (
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const schedule = formatSchedule(row);
              return (
              <tr key={`${row.facilityType}-${row.id}`} className="align-top">
                <td className="px-4 py-4 font-medium whitespace-nowrap text-gray-700">
                  {FACILITY_LABEL[row.facilityType]}
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-gray-800">{row.title}</div>
                  <div className="text-gray-500">{row.detail}</div>
                  {row.adminMessage && (
                    <div className="mt-1 text-xs text-gray-500 italic">
                      Admin note: {row.adminMessage}
                    </div>
                  )}
                </td>
                {showRequester && (
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    {row.requestedByName}
                  </td>
                )}
                <td className="px-4 py-4 whitespace-nowrap text-gray-600 tabular-nums">
                  {schedule.dates}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600 tabular-nums">
                  {schedule.showPerDay ? (
                    <ul className="flex flex-col gap-0.5">
                      {schedule.perDay.map((line) => (
                        <li key={line.date}>
                          <span className="inline-block w-20 text-gray-400">{line.day}</span>
                          {line.time}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    schedule.time
                  )}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={row.status} />
                  {row.decidedBy && (
                    <div className="mt-1 text-xs text-gray-400">by {row.decidedBy}</div>
                  )}
                </td>
                {cancellable && (
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {row.status === "APPROVED" && <CancelBookingButton row={row} />}
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
