"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Re-fetches the current page's server data in place (router.refresh) so a
 * list picks up new or decided requests without a full page reload. The icon
 * spins while the refresh is in flight and the label shows when it last ran.
 */
export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [, tick] = useState(0);

  // Keep "x min ago" honest while the page sits open.
  useEffect(() => {
    if (!refreshedAt) return;
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [refreshedAt]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
      setRefreshedAt(new Date());
    });
  };

  const ago = refreshedAt ? describeAgo(refreshedAt) : null;

  return (
    <div className="flex items-center gap-2">
      {ago && <span className="hidden text-xs text-gray-400 sm:inline">Updated {ago}</span>}
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        aria-label={label}
        title={label}
        className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70"
      >
        <svg
          className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h5M20 20v-5h-5M5.5 14.5A7 7 0 0 0 18 16.5M18.5 9.5A7 7 0 0 0 6 7.5"
          />
        </svg>
        <span className="hidden sm:inline">{isPending ? "Refreshing…" : label}</span>
      </button>
    </div>
  );
}

function describeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
