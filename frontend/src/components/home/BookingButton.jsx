import React from "react";

const BookingButton = ({ onClick }) => {
  return (
    <div className="flex justify-center mb-16 relative z-10">
      {/* Glow Background */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 md:w-56 h-12 bg-primary/20 blur-lg rounded-full"></div>

      <button
        onClick={onClick}
        className="animate-float relative overflow-hidden bg-primary text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-bold text-base md:text-lg shadow-lg hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-3 group"
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full z-0"></div>

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 md:gap-3">
          <svg
            className="w-5 h-5 md:w-6 md:h-6 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Book a Slot
        </span>
      </button>
    </div>
  );
};

export default BookingButton;
