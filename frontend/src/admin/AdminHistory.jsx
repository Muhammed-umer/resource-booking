import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { getRole } from "../utils/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Import as function

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const role = getRole(); 
  
  // ... (Keep existing state and useEffects) ...
  const [filters, setFilters] = useState({
    status: "ALL",
    resource: "ALL",
    dept: "ALL",
    date: ""
  });
  const departments = ["CSE", "EEE", "ECE", "MECHANICAL", "CIVIL", "IT", "AUTOMOBILE"];

  useEffect(() => { fetchHistoryData(); }, []);
  useEffect(() => { applyFilters(); }, [filters, history]);

  const fetchHistoryData = async () => {
    try {
      let data = [];
      if (role === "ADMIN_SEMINAR") {
        const res = await axiosInstance.get("/api/bookings");
        data = res.data.filter(b => 
          (b.facilityType === "SEMINAR_HALL" || b.facilityType === "AUDITORIUM") &&
          b.bookingStatus !== "PENDING"
        );
      } else if (role === "ADMIN_RESOURCE") {
        const res = await axiosInstance.get("/guesthouse/all");
        data = res.data
            .filter(b => b.status !== "PENDING")
            .map(b => ({
                bookingId: b.bookingId,
                eventName: b.guestName,
                department: b.requestedBy,
                facilityType: "GUEST_HOUSE",
                bookingStatus: b.status,
                fromDate: b.fromDate,
                toDate: b.toDate,
                roomNumber: b.roomNumber
            }));
      }
      data.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  // ... (Keep applyFilters and getStatusBadge) ...
  const applyFilters = () => {
      let result = [...history];

      if (filters.status !== "ALL") result = result.filter(r => r.bookingStatus === filters.status);
      if (filters.resource !== "ALL") result = result.filter(r => r.facilityType === filters.resource);
      if (filters.dept !== "ALL") {
        result = result.filter(r => 
            r.department && r.department.toUpperCase().includes(filters.dept)
        );
      }
      if (filters.date) {
        const sel = new Date(filters.date);
        result = result.filter(r => new Date(r.fromDate) <= sel && new Date(r.toDate) >= sel);
      }
      setFilteredHistory(result);
  }

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Booking History Report", 14, 15);
    
    const tableColumn = ["Event", "Dept/User", "Resource", "Date", "Status"];
    const tableRows = filteredHistory.map(b => [
      b.eventName,
      b.department || "N/A",
      b.facilityType.replace("_", " "),
      b.fromDate,
      b.bookingStatus
    ]);

    // ✅ FIXED: Correct usage
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("admin_history_report.pdf");
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200"
    };
    return `px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {/* ✅ FIXED: Better Welcome Logic */}
            Welcome, {role === "ADMIN_SEMINAR" ? "Seminar Admin" : (role === "ADMIN_RESOURCE" ? "Resource Admin" : "Admin")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">History & Records</p>
        </div>
        <button 
          onClick={exportPDF}
          className="mt-4 md:mt-0 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow transition"
        >
          Export PDF
        </button>
      </div>
      
      {/* ... (Keep Filter Bar and Table sections exactly as they were) ... */}
       {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Department Filter */}
        <select 
            className="border rounded px-3 py-2 outline-none focus:border-primary"
            onChange={(e) => setFilters({...filters, dept: e.target.value})}
        >
            <option value="ALL">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select 
            className="border rounded px-3 py-2 outline-none focus:border-primary"
            onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
        </select>
        
        <input 
            type="date" 
            className="border rounded px-3 py-2 outline-none focus:border-primary"
            onChange={(e) => setFilters({...filters, date: e.target.value})}
        />

        <button 
             onClick={() => setFilters({status: "ALL", resource: "ALL", dept: "ALL", date: ""})}
             className="text-gray-500 underline text-sm"
        >
            Reset Filters
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Event / Guest</th>
              <th className="p-4">Dept / User</th>
              <th className="p-4">Resource</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((r) => (
              <tr key={r.bookingId} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-700">{r.eventName}</td>
                <td className="p-4 text-sm font-medium text-blue-600">{r.department}</td>
                <td className="p-4 text-sm text-gray-500">{r.facilityType.replace("_", " ")}</td>
                <td className="p-4 text-sm text-gray-500">{r.fromDate}</td>
                <td className="p-4">
                  <span className={getStatusBadge(r.bookingStatus)}>{r.bookingStatus}</span>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
                 <tr><td colSpan="5" className="p-10 text-center text-gray-400">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminHistory;