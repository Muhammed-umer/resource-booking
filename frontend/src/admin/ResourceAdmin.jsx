import React, { useEffect, useState } from "react";
import { getPendingBookings } from "../api/bookingApi";

const ResourceAdmin = () => {
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        getPendingBookings("AUDITORIUM,GUEST_HOUSE")
            .then(res => setBookings(res.data));
    }, []);

    return (
        <div>
            <h1>Auditorium & Guest House Requests</h1>
            {bookings.map(b => (
                <div key={b.bookingId}>
                    {b.eventName} - {b.facilityType}
                </div>
            ))}
        </div>
    );
};


export default ResourceAdmin;