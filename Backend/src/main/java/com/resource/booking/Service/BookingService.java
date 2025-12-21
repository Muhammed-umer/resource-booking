package com.resource.booking.Service;

import com.resource.booking.entity.Booking;
import com.resource.booking.entity.BookingStatus;
import com.resource.booking.entity.FacilityType;
import com.resource.booking.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    // Constructor Injection
    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // ---------------- Create Booking with Time Clash Check ----------------
    public Booking createBooking(Booking booking) {
        if (!isBookingTimeAvailable(booking)) {
            throw new IllegalArgumentException(
                    "Selected time slot is already booked for this facility."
            );
        }
        return bookingRepository.save(booking);
    }

    // ---------------- Get All Bookings ----------------
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ---------------- Get Bookings by Facility ----------------
    public List<Booking> getBookingsByFacility(String facilityTypeStr) {
        FacilityType facilityType = FacilityType.valueOf(facilityTypeStr.toUpperCase());
        return bookingRepository.findByFacilityType(facilityType);
    }

    // ---------------- Approve Booking ----------------
    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setBookingStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    // ---------------- Reject Booking ----------------
    public Booking rejectBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setBookingStatus(BookingStatus.REJECTED);
        return bookingRepository.save(booking);
    }

    // ---------------- Time Clash Check ----------------
    public boolean isBookingTimeAvailable(Booking newBooking) {
        List<Booking> approvedBookings = bookingRepository.findByFacilityTypeAndBookingStatus(
                newBooking.getFacilityType(),
                BookingStatus.APPROVED
        );

        for (Booking booking : approvedBookings) {
            boolean dateOverlap = !(newBooking.getToDate().isBefore(booking.getFromDate()) ||
                    newBooking.getFromDate().isAfter(booking.getToDate()));

            boolean timeOverlap = !(newBooking.getEndTime().isBefore(booking.getStartTime()) ||
                    newBooking.getStartTime().isAfter(booking.getEndTime()));

            if (dateOverlap && timeOverlap) {
                return false;
            }
        }
        return true;
}
}
