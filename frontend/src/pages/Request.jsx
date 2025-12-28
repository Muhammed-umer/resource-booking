import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Request = () => {
  const navigate = useNavigate();
  // Ensure we handle cases where localStorage might be empty
  const userEmail = localStorage.getItem('email') || "anonymous@college.edu";

  const [formData, setFormData] = useState({
    eventName: '',
    facilityType: 'SEMINAR_HALL', // Default Enum
    fromDate: '',
    toDate: '',
    startTime: '',
    endTime: '',
    department: 'CSE', // Default
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Construct the payload matching Booking.java Entity
      const payload = {
        ...formData,
        requestedBy: userEmail,
        bookingStatus: "PENDING"
      };

      // 2. Send Request
      await api.post('/api/bookings/request', payload);

      setMessage('Booking requested successfully!');
      setTimeout(() => navigate('/'), 2000); // Redirect to home
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Booking failed. Check for conflicts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Resource</h2>

        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Event Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Event Name</label>
            <input name="eventName" required onChange={handleChange} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., AI Workshop" />
          </div>

          {/* Facility Type (ENUMS) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Resource</label>
            <select name="facilityType" onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
              <option value="SEMINAR_HALL">Seminar Hall</option>
              <option value="AUDITORIUM">Auditorium</option>
              <option value="GUEST_HOUSE">Guest House</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">From Date</label>
              <input type="date" name="fromDate" required onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">To Date</label>
              <input type="date" name="toDate" required onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Start Time</label>
              <input type="time" name="startTime" required onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">End Time</label>
              <input type="time" name="endTime" required onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Department</label>
            <select name="department" onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECHANICAL">Mechanical</option>
              <option value="CIVIL">Civil</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors">
            {loading ? 'Processing...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

// THIS LINE WAS MISSING OR INCORRECT
export default Request;