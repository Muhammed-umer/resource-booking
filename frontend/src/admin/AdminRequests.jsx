import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { approveBooking, rejectBooking } from "../api/bookingApi";
import { getRole } from "../utils/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Import as function

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const role = getRole(); 

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      let data = [];
      if (role === "ADMIN_SEMINAR") {
        const [audiRes, semRes] = await Promise.all([
            axiosInstance.get("/api/bookings/pending?facilityType=AUDITORIUM"),
            axiosInstance.get("/api/bookings/pending?facilityType=SEMINAR_HALL")
        ]);
        data = [...audiRes.data, ...semRes.data];
      } else if (role === "ADMIN_RESOURCE") {
        const res = await axiosInstance.get("/guesthouse/pending");
        data = res.data.map(b => ({
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
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
    }
  };

  const handleAction = async (id, facility, action) => {
    if(!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      if (facility === "GUEST_HOUSE") {
        const endpoint = action === "Approve" ? `/guesthouse/approve/${id}` : `/guesthouse/reject/${id}`;
        await axiosInstance.put(endpoint);
      } else {
        if (action === "Approve") await approveBooking(id, facility);
        else await rejectBooking(id, facility, "Rejected by Admin");
      }
      setRequests(prev => prev.filter(r => r.bookingId !== id));
    } catch (err) {
      alert("Action Failed: " + (err.response?.data || err.message));
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Pending Requests Report", 14, 15);
    
    const tableColumn = ["Event", "Requested By", "Resource", "Date"];
    const tableRows = requests.map(b => [
      b.eventName,
      b.department,
      b.facilityType,
      b.fromDate
    ]);

    // ✅ FIXED: Correct usage of autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("pending_requests.pdf");
  };

  // ✅ FIXED: Better logic for Welcome Title
  const getTitle = () => {
    if (role === "ADMIN_SEMINAR") return "Seminar Admin";
    if (role === "ADMIN_RESOURCE") return "Resource Admin";
    return "Admin"; // Fallback
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {getTitle()}
            </h1>
            <p className="text-gray-500 mt-1">Incoming Requests</p>
        </div>
        <button onClick={exportPDF} className="mt-4 md:mt-0 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow transition">
            Export List as PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-gray-600">Event / Guest</th>
              <th className="p-4 text-gray-600">Resource</th>
              <th className="p-4 text-gray-600">Requested By</th>
              <th className="p-4 text-gray-600">Date</th>
              <th className="p-4 text-center text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={`${r.facilityType}-${r.bookingId}`} className="border-b hover:bg-gray-50 transition">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{r.eventName}</p>
                </td>
                <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                        {r.facilityType.replace("_", " ")} {r.roomNumber && `#${r.roomNumber}`}
                    </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{r.department}</td>
                <td className="p-4 text-sm text-gray-600">{r.fromDate}</td>
                <td className="p-4 flex justify-center gap-3">
                    <button onClick={() => handleAction(r.bookingId, r.facilityType, "Approve")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition transform active:scale-95">Accept</button>
                    <button onClick={() => handleAction(r.bookingId, r.facilityType, "Reject")} className="bg-white border border-red-500 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition transform active:scale-95">Decline</button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400">✅ All caught up! No pending requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminRequests;