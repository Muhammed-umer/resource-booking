import React, { useState, useEffect } from "react";
import { fetchCalendarData } from "../../services/Calendar";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);

  // --- Helpers ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // --- Fetch Data ---
  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();

      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const end = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

      const data = await fetchCalendarData(start, end);
      setCalendarData(data || []);
      setLoading(false);
    };
    fetchStatus();
  }, [currentDate]);

  // --- Handlers ---
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getStatusForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
    return calendarData.find((d) => d.date === dateStr);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const monthName = months[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // --- FIXED HEIGHT LOGIC ---
  // Always render 6 rows (42 slots) so the height never changes
  const TOTAL_SLOTS = 42;
  const emptySlotsAfter = TOTAL_SLOTS - daysInMonth - startDay;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 max-w-2xl mx-auto mt-6 select-none relative z-10 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 tracking-tight">
          {monthName} <span className="text-primary">{year}</span>
        </h3>
        <div className="flex gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
          <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all active:scale-95 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all active:scale-95 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-gray-400 uppercase">{day}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* 1. Empty Slots Before Month Starts */}
        {[...Array(startDay)].map((_, i) => <div key={`empty-start-${i}`} className="h-9 md:h-12" />)}

        {/* 2. Days of the Month */}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const statusObj = getStatusForDay(day);

          const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

          const audStatus = statusObj?.auditoriumStatus || "AVAILABLE";
          const semStatus = statusObj?.seminarHallStatus || "AVAILABLE";
          const gstStatus = statusObj?.guestHouseStatus || "AVAILABLE";

          return (
            <div
              key={day}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`
                relative h-9 md:h-12 rounded-lg border transition-all flex flex-col items-center justify-center cursor-default group
                ${isToday ? "bg-primary/10 border-primary ring-1 ring-primary/30 font-bold text-primary" : "border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700"}
              `}
            >
              <span className="text-xs md:text-sm leading-none">{day}</span>

              {/* Status Row */}
              <div className="flex gap-1 mt-1 h-2 items-center">
                {loading ? (
                  <div className="w-1 h-1 bg-gray-200 rounded-full animate-pulse" />
                ) : (
                  <>
                    <StatusIndicator status={audStatus} color="bg-teal-500" />
                    <StatusIndicator status={semStatus} color="bg-orange-500" />
                    <StatusIndicator status={gstStatus} color="bg-purple-600" />
                  </>
                )}
              </div>

              {/* Tooltip */}
              {hoveredDay === day && (audStatus !== "AVAILABLE" || semStatus !== "AVAILABLE" || gstStatus !== "AVAILABLE") && (
                <div className="absolute z-50 bottom-full mb-1 w-36 bg-gray-900/95 backdrop-blur text-white text-[10px] p-2 rounded-md shadow-xl pointer-events-none animate-[fadeIn_0.2s]">
                   <div className="font-bold border-b border-gray-700 pb-1 mb-1">{day} {monthName}</div>
                   <div className="space-y-1">
                      {audStatus !== "AVAILABLE" && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>Auditorium: {audStatus}</div>}
                      {semStatus !== "AVAILABLE" && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Seminar: {semStatus}</div>}
                      {gstStatus !== "AVAILABLE" && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>Guest House: {gstStatus}</div>}
                   </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 3. Empty Slots After Month Ends (To Maintain Height) */}
        {[...Array(emptySlotsAfter)].map((_, i) => <div key={`empty-end-${i}`} className="h-9 md:h-12" />)}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 border-t border-gray-100 pt-3">
        <LegendItem color="bg-teal-500" label="Auditorium" />
        <LegendItem color="bg-orange-500" label="Seminar" />
        <LegendItem color="bg-purple-600" label="Guest House" />
      </div>
    </div>
  );
};

const StatusIndicator = ({ status, color }) => {
  if (status === "AVAILABLE" || !status) return null;
  return (
    // Mobile: w-2 h-2 (8px) | Desktop: w-3 h-3 (12px)
    <div className="w-2 h-2 md:w-3 md:h-3 flex items-center transition-all">
      {status === "FULL" && <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${color}`}></div>}
      {status === "FN" && <div className={`w-1 h-2 md:w-1.5 md:h-3 rounded-l-full ${color}`}></div>}
      {status === "AN" && <div className={`w-1 h-2 md:w-1.5 md:h-3 rounded-r-full ${color} ml-auto`}></div>}
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[10px] md:text-xs text-gray-500 font-medium">{label}</span>
  </div>
);

export default CalendarView;