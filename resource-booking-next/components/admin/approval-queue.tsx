import { DecisionCard } from "@/components/admin/decision-card";
import type { RequestRow } from "@/lib/bookings/view";

export function ApprovalQueue({
  rows,
  emptyMessage,
}: {
  rows: RequestRow[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => (
        <DecisionCard key={`${row.facilityType}-${row.id}`} row={row} />
      ))}
    </ul>
  );
}
