import React, { useState, useEffect } from "react";

import api from "../../services/api";

const BookingModal = ({ isOpen, onClose, selectedResource, onShowStatus }) => {
  const [formData, setFormData] = useState({
    resourceType: "",
    fromDate: "",
    toDate: "",
    eventName: "",
    startTime: "",
    endTime: "",
    department: "",
    guestName: "",
    phoneNumber: "",
    purpose: "",
    checkInTime: "",
    checkOutTime: "",
    roomNumber: 1,
    requestedBy: "CurrentUser",
  });

  useEffect(() => {
    if (isOpen && selectedResource) {
      setFormData((prev) => ({ ...prev, resourceType: selectedResource }));
    }
  }, [isOpen, selectedResource]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    const isGuestHouse = formData.resourceType === "Guest House";

    // 1. Determine the URL (We use relative paths now)
    const url = isGuestHouse
      ? "/guesthouse/book"
      : "/api/bookings";

    // 2. Construct Payload (This part remains the same as your original code)
    let payload = {};
    if (isGuestHouse) {
      payload = {
        guestName: formData.guestName,
        phoneNumber: formData.phoneNumber,
        purpose: formData.purpose,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        checkInTime: formData.checkInTime + ":00",
        checkOutTime: formData.checkOutTime + ":00",
        roomNumber: parseInt(formData.roomNumber),
        requestedBy: formData.requestedBy,
      };
    } else {
      payload = {
        facilityType: formData.resourceType === "Auditorium" ? "AUDITORIUM" : "SEMINAR_HALL",
        eventName: formData.eventName,
        department: formData.department,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        startTime: formData.startTime + ":00",
        endTime: formData.endTime + ":00",
        requestedBy: formData.requestedBy,
      };
    }

    try {
      // 3. Send Request using 'api' (Headers & Token are handled automatically)
      await api.post(url, payload);

      // 4. Success handling
      onShowStatus("success", "Booking Request Sent Successfully!");
    } catch (error) {
      console.error("Network Error:", error);

      // 5. Error handling (Extracts message from backend response)
      const errorMsg = error.response?.data || "Booking Failed";
      onShowStatus("error", typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  if (!isOpen) return null;



  const isGuestHouse = formData.resourceType === "Guest House";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-[fadeIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto overflow-x-hidden no-scrollbar">

        {/* Header - Uses Primary Color */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center sticky top-0 z-20 text-white shadow-md">
          <h3 className="font-semibold text-lg">Book {formData.resourceType || "Resource"}</h3>
          <button onClick={onClose} className="hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Resource Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              name="resourceType"
              value={formData.resourceType}
              onChange={handleChange}
              disabled={!!selectedResource}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary ${selectedResource ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="" disabled>Select a resource...</option>
              <option value="Auditorium">Auditorium</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Guest House">Guest House</option>
            </select>
          </div>

          {/* Dynamic Fields */}
          {!isGuestHouse && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input required type="text" name="eventName" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Annual Day" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input required type="text" name="department" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. CSE" />
              </div>
            </>
          )}

          {isGuestHouse && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                <input required type="text" name="guestName" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input required type="tel" name="phoneNumber" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input required type="number" name="roomNumber" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" min="1" />
                </div>
              </div>
            </>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input required type="date" name="fromDate" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input required type="date" name="toDate" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isGuestHouse ? "Check-In Time" : "Start Time"}
              </label>
              <input required type="time" name={isGuestHouse ? "checkInTime" : "startTime"} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 {isGuestHouse ? "Check-Out Time" : "End Time"}
              </label>
              <input required type="time" name={isGuestHouse ? "checkOutTime" : "endTime"} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {isGuestHouse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
              <textarea name="purpose" onChange={handleChange} rows="2" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"></textarea>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark shadow-lg mt-4 transition-transform active:scale-95"
          >
            Confirm Booking
          </button>

        </form>
      </div>
    </div>
  );
};

export default BookingModal;