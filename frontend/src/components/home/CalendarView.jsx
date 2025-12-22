import React from "react";

const CalendarView = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800">
          December 2024
        </h3>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 border border-gray-200">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 border border-gray-200">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-4 text-center text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wide">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {[...Array(35)].map((_, i) => {
          const day = i - 2;
          const isToday = day === 22;
          const isBooked = day === 15 || day === 24;

          if (day < 1 || day > 31)
            return (
              <div
                key={i}
                className="h-14 md:h-24 bg-gray-50/50 rounded-lg md:rounded-xl"
              ></div>
            );

          return (
            <div
              key={i}
              className={`h-14 md:h-24 rounded-lg md:rounded-xl border p-1 md:p-3 relative transition-colors ${
                isToday
                  ? "bg-primary/5 border-primary ring-1 ring-primary"
                  : "bg-white border-gray-100 hover:border-primary/50"
              }`}
            >
              <span
                className={`text-xs md:text-sm font-medium ${
                  isToday ? "text-primary" : "text-gray-700"
                }`}
              >
                {day}
              </span>
              {isBooked && (
                <div className="mt-1 md:mt-3 h-1 md:h-1.5 w-full bg-red-400 rounded-full opacity-70"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
