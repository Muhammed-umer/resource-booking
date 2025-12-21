package com.resource.booking.Service;

import com.resource.booking.entity.GuestHouse;
import com.resource.booking.entity.BookingStatus;
import com.resource.booking.repository.GuestHouseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuestHouseService {

    private final GuestHouseRepository guestHouseRepository;

    public GuestHouseService(GuestHouseRepository guestHouseRepository) {
        this.guestHouseRepository = guestHouseRepository;
    }

    // ⿡ Save booking with overlap check
    public GuestHouse saveBooking(GuestHouse guestHouse) {
        // Check room availability
        List<GuestHouse> conflicts = guestHouseRepository
                .findByRoomNumberAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                        guestHouse.getRoomNumber(),
                        guestHouse.getToDate(),
                        guestHouse.getFromDate()
                );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Selected room is already booked for these dates");
        }

        // Save booking
        return guestHouseRepository.save(guestHouse);
    }

    // ⿢ Get all bookings
    public List<GuestHouse> getAllBookings() {
        return guestHouseRepository.findAll();
    }

    // ⿣ Get booking by ID
    public GuestHouse getBookingById(Long id) {
        return guestHouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));
    }

    // ⿤ Approve booking
    public GuestHouse approveBooking(Long id) {
        GuestHouse booking = getBookingById(id);
        booking.setStatus(BookingStatus.APPROVED);
        return guestHouseRepository.save(booking);
    }

    // ⿥ Reject booking
    public GuestHouse rejectBooking(Long id) {
        GuestHouse booking = getBookingById(id);
        booking.setStatus(BookingStatus.REJECTED);
        return guestHouseRepository.save(booking);
    }
}
