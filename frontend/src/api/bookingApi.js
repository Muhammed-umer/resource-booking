import axiosInstance from "./axiosInstance";

export const createBooking = (data) => {
    return axiosInstance.post("/api/bookings", data);
};

export const getMyBookings = () => {
    return axiosInstance.get("/api/bookings/history");
};
// Admin APIs
export const getPendingBookings = (facilityType) =>
    axiosInstance.get(`/api/bookings/pending?facilityType=${facilityType}`);

export const approveBooking = (id, facilityType) =>
    axiosInstance.post(`/api/bookings/${id}/approve?facilityType=${facilityType}`);

export const rejectBooking = (id, facilityType, adminMessage) =>
    axiosInstance.post(`/api/bookings/${id}/reject?facilityType=${facilityType}`, { adminMessage });