import React, { useEffect, useState } from "react";
import { getPendingBookings } from "../api/bookingApi";
import axiosInstance from "../api/axiosInstance";

const ResourceAdmin = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchAdminData = async () => {
            // 1. Fetch Auditorium (Standard API)
            // Note: You must ensure BookingController has a way to get 'AUDITORIUM' pending specifically, 
            // or filter it on the client side from getAllBookings
            const auditoriumRes = await getPendingBookings("AUDITORIUM"); 
            
            // 2. Fetch Guest House (New API)
            const ghRes = await axiosInstance.get("/guesthouse/pending");

            // 3. Format Guest House to match
            const ghFormatted = ghRes.data.map(b => ({
                ...b,
                facilityType: "GUEST_HOUSE",
                eventName: `Guest House Request (Room ${b.roomNumber})`,
                bookingStatus: b.status
            }));

            setRequests([...auditoriumRes.data, ...ghFormatted]);
        };
        fetchAdminData();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Resource Admin Dashboard</h1>
            {requests.map(b => (
                <div key={b.bookingId} className="border p-4 mb-4 rounded bg-white shadow flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{b.eventName}</h3>
                        <p className="text-gray-600">{b.department || b.guestName}</p>
                        <p className="text-sm text-gray-400">{b.fromDate}</p>
                    </div>
                    {/* Add Approve/Reject Buttons here calling the respective APIs based on facilityType */}
                </div>
            ))}
        </div>
    );
};
export default ResourceAdmin;