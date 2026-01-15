import React, { useEffect, useState } from "react";
import { getMyBookings } from "../api/bookingApi";
import axiosInstance from "../api/axiosInstance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ 1. Import like this

const History = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filters, setFilters] = useState({ resource: "ALL", status: "ALL", date: "" });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [filters, allBookings]);

  const fetchData = async () => {
    try {
      const standardRes = await getMyBookings();
      const ghRes = await axiosInstance.get("/guesthouse/history");

      const ghFormatted = ghRes.data.map((b) => ({
        bookingId: b.bookingId,
        eventName: `Guest House - Room ${b.roomNumber}`,
        facilityType: "GUEST_HOUSE",
        fromDate: b.fromDate,
        toDate: b.toDate,
        bookingStatus: b.status,
      }));

      const combined = [...standardRes.data, ...ghFormatted].sort(
        (a, b) => new Date(b.fromDate) - new Date(a.fromDate)
      );
      setAllBookings(combined);
    } catch (err) {
      console.error("Error loading history", err);
    }
  };

  const applyFilters = () => {
    let result = [...allBookings];
    if (filters.resource !== "ALL") result = result.filter((b) => b.facilityType === filters.resource);
    if (filters.status !== "ALL") result = result.filter((b) => b.bookingStatus === filters.status);
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      result = result.filter((b) => {
        const start = new Date(b.fromDate);
        const end = new Date(b.toDate);
        return selectedDate >= start && selectedDate <= end;
      });
    }
    setFilteredBookings(result);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("My Booking History", 14, 15);
    
    const tableColumn = ["Event / Room", "Resource", "Date Range", "Status"];
    const tableRows = filteredBookings.map(b => [
      b.eventName,
      b.facilityType.replace("_", " "),
      `${b.fromDate} to ${b.toDate}`,
      b.bookingStatus
    ]);

    // ✅ 2. Use like this
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("my_booking_history.pdf");
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-700 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Booking History</h2>
        <button onClick={exportPDF} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow-sm transition">
          Download PDF
        </button>
      </div>
      {/* ... Filters and Table UI remain the same ... */}
       {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
        >
          <option value="ALL">All Resources</option>
          <option value="AUDITORIUM">Auditorium</option>
          <option value="SEMINAR_HALL">Seminar Hall</option>
          <option value="GUEST_HOUSE">Guest House</option>
        </select>

        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <input
          type="date"
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />

        <button 
          onClick={() => setFilters({ resource: "ALL", status: "ALL", date: "" })}
          className="text-sm text-gray-500 hover:text-primary underline ml-auto"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Event / Room</th>
              <th className="p-4 font-semibold text-gray-600">Resource</th>
              <th className="p-4 font-semibold text-gray-600">Date Range</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => (
              <tr key={`${b.facilityType}-${b.bookingId}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td className="p-4 font-medium text-gray-800">{b.eventName}</td>
                <td className="p-4 text-gray-500 text-sm">{b.facilityType.replace("_", " ")}</td>
                <td className="p-4 text-gray-500 text-sm">
                  {b.fromDate} <span className="text-gray-300 mx-1">to</span> {b.toDate}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(b.bookingStatus)}`}>
                    {b.bookingStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default History;