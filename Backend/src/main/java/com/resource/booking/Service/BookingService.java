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

    // REPLACE YOUR EXISTING createBooking WITH THIS:
    public Booking createBooking(Booking booking) {
        // 1. Ask DB for conflicts using the NEW method we created
        List<Booking> conflicts = bookingRepository.findConflicts(
                booking.getFacilityType(),
                booking.getFromDate(),
                booking.getToDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        // 2. If list is not empty, block it
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException(
                    "Selected time slot is already booked for this facility."
            );
        }

        // 3. Save
        booking.setBookingStatus(BookingStatus.PENDING);
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


}
