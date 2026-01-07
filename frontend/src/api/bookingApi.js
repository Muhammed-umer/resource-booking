import axios from "axios";
import { API_BASE_URL } from "../Config";
import { getToken } from "../utils/auth";


const authHeader = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
});

export const getPendingBookings = (facilityType) =>
    axios.get(
        `${API_BASE_URL}/api/bookings/pending?facilityType=${facilityType}`,
        authHeader()
    );

export const approveBooking = (id, facilityType) =>
    axios.post(
        `${API_BASE_URL}/api/bookings/${id}/approve?facilityType=${facilityType}`,
        {},
        authHeader()
    );

export const rejectBooking = (id, facilityType, adminMessage) =>
    axios.post(
        `${API_BASE_URL}/api/bookings/${id}/reject?facilityType=${facilityType}`,
        { adminMessage },
        authHeader()
    );