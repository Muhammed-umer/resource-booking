import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const History = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filtering & Sorting States ---
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hallRes, guestRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/bookings`),
          axios.get(`${API_BASE_URL}/guesthouse/all`)
        ]);

        const halls = hallRes.data.map(item => ({
          id: `H-${item.bookingId}`,
          facility: item.facilityType === "SEMINAR_HALL" ? "Seminar Hall" : "Auditorium",
          status: item.bookingStatus,
          reqDate: item.createdAt,
          fromDate: item.fromDate,
          toDate: item.toDate,
          type: "hall"
        }));

        const guests = guestRes.data.map(item => ({
          id: `G-${item.id}`,
          facility: "Guest House",
          status: item.status,
          reqDate: item.createdAt,
          fromDate: item.fromDate,
          toDate: item.toDate,
          type: "guest"
        }));

        setData([...halls, ...guests]);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Logic Helpers ---
  const isCompleted = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(dateString) < today;
  };

  const formatDate = (dateStr) => {
    if(!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  // --- Filter & Sort ---
  const processedData = data
    .filter(item => filterStatus === "ALL" || item.status === filterStatus)
    .sort((a, b) => {
      const dateA = new Date(a.reqDate);
      const dateB = new Date(b.reqDate);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // --- UI Components ---
  const StatusBadge = ({ status }) => {
    let styles = "bg-gray-100 text-gray-600";
    if (status === "APPROVED") styles = "bg-teal-100 text-teal-700 border border-teal-200";
    if (status === "PENDING") styles = "bg-orange-100 text-orange-700 border border-orange-200";
    if (status === "REJECTED") styles = "bg-red-100 text-red-700 border border-red-200";

    return (
      <span className={`px-2.5 py-0.5 rounded-md text-[10px] md:text-xs font-bold tracking-wide ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50/50">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Booking History</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Track your facility requests.</p>
        </div>

        {/* Filters */}
        <div className="flex w-full md:w-auto gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          <select
            className="flex-1 md:flex-none text-sm border-none outline-none text-gray-600 bg-transparent px-2 py-1 font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="w-px bg-gray-200 my-1"></div>
          <select
            className="flex-1 md:flex-none text-sm border-none outline-none text-gray-600 bg-transparent px-2 py-1 font-medium"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading records...</div>
      ) : processedData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500">No records found matching your filters.</p>
        </div>
      ) : (
        <>
          {/* =======================
              MOBILE VIEW (CARDS)
              Visible on Small Screens (hidden md:block)
             ======================= */}
          <div className="md:hidden space-y-4">
            {processedData.map((row) => {
              const completed = isCompleted(row.toDate);
              return (
                <div key={row.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">

                  {/* Card Header: Facility + Status */}
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                        {row.type === 'guest' ? '🏠' : '🏢'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{row.facility}</h3>
                        <p className="text-[10px] text-gray-400">ID: {row.id}</p>
                      </div>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>

                  {/* Card Body: Dates */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-gray-400 mb-1">Requested On</p>
                      <p className="font-medium text-gray-700">{formatDate(row.reqDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-gray-400 mb-1">Event Date</p>
                      <p className="font-medium text-gray-700">
                        {formatDate(row.fromDate)}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Completion */}
                  <div className="flex justify-between items-center pt-1">
                     <span className="text-xs text-gray-400">Completed?</span>
                     {completed ? (
                       <span className="text-teal-600 font-bold text-xs flex items-center gap-1">
                         ✅ Yes
                       </span>
                     ) : (
                       <span className="text-gray-400 text-xs">No</span>
                     )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* =======================
              DESKTOP VIEW (TABLE)
              Visible on Medium+ Screens (hidden md:block)
             ======================= */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
                    <th className="px-6 py-4">S.No</th>
                    <th className="px-6 py-4">Facility</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Requested On</th>
                    <th className="px-6 py-4">Booked Date(s)</th>
                    <th className="px-6 py-4 text-center">Completed?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedData.map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors text-sm text-gray-700">
                      <td className="px-6 py-4 text-gray-400">{(index + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{row.facility}</td>
                      <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(row.reqDate)}</td>
                      <td className="px-6 py-4 font-medium">
                        {formatDate(row.fromDate)}
                        {row.fromDate !== row.toDate && ` - ${formatDate(row.toDate)}`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCompleted(row.toDate) ? <span className="text-teal-600">✅</span> : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default History;