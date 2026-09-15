"use client";

/** The GPay-style confirmation popup from the Vite app. */
export function StatusModal({
  isOpen,
  type,
  message,
  onClose,
}: {
  isOpen: boolean;
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-scale-up relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div
          className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${
            isSuccess ? "bg-success-light" : "animate-shake bg-error-light"
          }`}
        >
          {isSuccess ? (
            <svg
              className="h-10 w-10 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                className="animate-draw-check"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-10 w-10 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        <h3
          id="status-modal-title"
          className={`mb-2 text-2xl font-bold ${
            isSuccess ? "text-gray-800" : "text-error"
          }`}
        >
          {isSuccess ? "Request sent" : "Booking failed"}
        </h3>

        <p className="mb-8 leading-relaxed text-gray-500">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className={`rounded-full px-8 py-3 font-semibold text-white shadow-md transition-transform active:scale-95 ${
            isSuccess
              ? "bg-success hover:bg-success-dark"
              : "bg-error hover:bg-error-dark"
          }`}
        >
          {isSuccess ? "Done" : "Try again"}
        </button>
      </div>
    </div>
  );
}
