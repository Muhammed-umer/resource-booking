import React from "react";

const BookingModal = ({ isOpen, onClose, selectedResource }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

  
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
        <div className="bg-primary px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg">Book a Resource</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              defaultValue={selectedResource}
            >
              <option value="" disabled>
                Select a resource...
              </option>
              <option value="Auditorium">Auditorium</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Guest House">Guest House</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Event details..."
            ></textarea>
          </div>
          <button
            type="button"
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark shadow-lg mt-2"
          >
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
