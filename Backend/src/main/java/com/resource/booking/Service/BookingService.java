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

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // ---------------- Create Booking (Updated Message Logic) ----------------
    public Booking createBooking(Booking booking) {

        // 1. Check for conflicts
        List<Booking> conflicts = bookingRepository.findConflicts(
                booking.getFacilityType(),
                booking.getFromDate(),
                booking.getToDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        // 2. If list is not empty, BLOCK IT with Details
        if (!conflicts.isEmpty()) {
            // Get the booking that is blocking us
            Booking blocker = conflicts.get(0);

            String dept = blocker.getDepartment();
            String reason = blocker.getEventName();

            // Throw detailed error
            throw new IllegalArgumentException(
                    "Already booked by " + dept + " for '" + reason + "'"
            );
        }

        // 3. Normal save
        booking.setBookingStatus(BookingStatus.PENDING);
        return bookingRepository.save(booking);
    }

    // ---------------- Get All Bookings ----------------
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ---------------- Get Bookings by Facility ----------------
    public List<Booking> getBookingsByFacility(String facilityTypeStr) {
        try {
            FacilityType facilityType = FacilityType.valueOf(facilityTypeStr.toUpperCase());
            return bookingRepository.findByFacilityType(facilityType);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid facility type: " + facilityTypeStr);
        }
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