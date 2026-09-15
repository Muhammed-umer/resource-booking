"use client";

import { useCallback, useState } from "react";

import type { ActionResult } from "@/app/actions/bookings";
import { BookingModal } from "@/components/home/booking-modal";
import { ResourceCard } from "@/components/home/resource-card";
import { StatusModal } from "@/components/home/status-modal";
import type { Department } from "@/lib/db/schema";
import { FACILITY_OPTIONS, type BookableFacility } from "@/lib/facilities";

/**
 * Owns the modal state that lived in the Vite Home page: pick a card, fill the
 * form, then see the success or conflict popup.
 */
export function BookingSurface({
  department,
}: {
  department: Department | null;
}) {
  const [facilityType, setFacilityType] = useState<BookableFacility | "">("");
  // Opened from a resource card → the facility is fixed to that card.
  // Opened from the "Book a slot" button → the user picks one in the form.
  const [isFacilityLocked, setIsFacilityLocked] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [status, setStatus] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  }>({ isOpen: false, type: "success", message: "" });

  const openFor = (facility: BookableFacility | "") => {
    setFacilityType(facility);
    setIsFacilityLocked(facility !== "");
    setIsFormOpen(true);
  };

  const handleResult = useCallback((result: ActionResult) => {
    setIsFormOpen(false);
    setStatus({
      isOpen: true,
      type: result.ok ? "success" : "error",
      message: result.message,
    });
  }, []);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:mb-10 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {FACILITY_OPTIONS.map((facility) => (
          <ResourceCard
            key={facility.value}
            title={facility.label}
            subtitle={facility.subtitle}
            capacity={facility.capacity}
            icon={facility.icon}
            colorTheme={facility.theme}
            onClick={() => openFor(facility.value)}
          />
        ))}
      </div>

      <div className="relative z-10 flex justify-center">
        <div className="absolute top-1/2 left-1/2 h-12 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-lg md:w-56" />
        <button
          type="button"
          onClick={() => openFor("")}
          className="animate-float group relative flex items-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:bg-primary-dark active:scale-95 md:px-12 md:py-4 md:text-lg"
        >
          <div className="animate-shine absolute inset-0 z-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <span className="relative z-10 flex items-center gap-2 md:gap-3">
            <svg
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Book a slot
          </span>
        </button>
      </div>

      <BookingModal
        isOpen={isFormOpen}
        facilityType={facilityType}
        facilityLocked={isFacilityLocked}
        department={department}
        onFacilityChange={setFacilityType}
        onClose={() => setIsFormOpen(false)}
        onResult={handleResult}
      />

      <StatusModal
        isOpen={status.isOpen}
        type={status.type}
        message={status.message}
        onClose={() => setStatus((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
