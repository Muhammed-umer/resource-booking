import React, { useEffect, useState } from "react";
import { getPendingBookings, approveBooking, rejectBooking } from "../api/bookingApi";

const SeminarAdmin = () => {
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        getPendingBookings("SEMINAR_HALL").then(res => setBookings(res.data));
    }, []);

    return (
        <div>
            <h1>Seminar Hall Requests</h1>
            {bookings.map(b => (
                <div key={b.bookingId}>
                    {b.eventName} - {b.department}
                    <button onClick={()=>approveBooking(b.bookingId,"SEMINAR_HALL")}>Approve</button>
                    <button onClick={()=>rejectBooking(b.bookingId,"SEMINAR_HALL","Rejected")}>Reject</button>
                </div>
            ))}
        </div>
    );
};

export default SeminarAdmin;