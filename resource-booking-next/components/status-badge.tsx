import type { BookingStatus } from "@/lib/db/schema";

const STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-pending-light text-pending",
  APPROVED: "bg-success-light text-success-dark",
  REJECTED: "bg-error-light text-error-dark",
  CANCELLED: "bg-gray-200 text-gray-600",
};

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
