package com.resource.booking.Service;

import com.resource.booking.entity.GuestHouse;
import com.resource.booking.entity.BookingStatus;
import com.resource.booking.repository.GuestHouseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuestHouseService {

    private final GuestHouseRepository guestHouseRepository;
    private final EmailService emailService;


    public GuestHouseService(GuestHouseRepository guestHouseRepository, EmailService emailService) {
        this.guestHouseRepository = guestHouseRepository;
        this.emailService = emailService;
    }

    // ---------------- Save Booking (With Detailed Error) ----------------
    public GuestHouse saveBooking(GuestHouse guestHouse) {
        // 1. Check room availability
        List<GuestHouse> conflicts = guestHouseRepository
                .findByRoomNumberAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                        guestHouse.getRoomNumber(),
                        guestHouse.getToDate(),
                        guestHouse.getFromDate()
                );

        // 2. If list is not empty, BLOCK IT with Details
        if (!conflicts.isEmpty()) {
            // Get the booking that is blocking this room
            GuestHouse blocker = conflicts.get(0);

            String name = blocker.getGuestName();
            String reason = blocker.getPurpose();

            // Throw detailed error
            throw new RuntimeException(
                    "Room " + guestHouse.getRoomNumber() + " is already booked by " + name + " (Purpose: " + reason + ")"
            );
        }

        // 3. Save booking
        guestHouse.setStatus(BookingStatus.PENDING);

        // --- FIX: Create the variable clearly here ---
        GuestHouse savedGH = guestHouseRepository.save(guestHouse);

        // 4. Send Email to GuestHouse Admin
        try {
            String adminEmail = "bindhujaa30@gmail.com";
            String subject = "New Guest House Booking Request";
            String body = "Hello Admin,\n\nA new Guest House booking has been requested.\n" +
                    "User: " + savedGH.getRequestedBy() + "\n" +
                    "Guest Name: " + savedGH.getGuestName() + "\n" +
                    "Room Number: " + savedGH.getRoomNumber() + "\n" +
                    "Dates: " + savedGH.getFromDate() + " to " + savedGH.getToDate();

            emailService.sendEmail(adminEmail, subject, body);
        } catch (Exception e) {
            // Log error so booking still works even if email fails
            System.err.println("Email notification failed: " + e.getMessage());
        }

        // 5. Return the saved variable
        return savedGH;

    }

    // ---------------- Get All Bookings ----------------
    public List<GuestHouse> getAllBookings() {
        return guestHouseRepository.findAll();
    }

    // ---------------- Get Booking by ID ----------------
    public GuestHouse getBookingById(Long id) {
        return guestHouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));
    }

    // ---------------- Approve Booking ----------------
    public GuestHouse approveBooking(Long id) {
        GuestHouse booking = getBookingById(id);
        booking.setStatus(BookingStatus.APPROVED);
        return guestHouseRepository.save(booking);
    }

    // ---------------- Reject Booking ----------------
    public GuestHouse rejectBooking(Long id) {
        GuestHouse booking = getBookingById(id);
        booking.setStatus(BookingStatus.REJECTED);
        return guestHouseRepository.save(booking);
    }

    // For Users
    public List<GuestHouse> getUserGuestHouseHistory(String email) {
        return guestHouseRepository.findByRequestedBy(email);
    }

    // For Admins
    public List<GuestHouse> getPendingBookings() {
        return guestHouseRepository.findByStatus(BookingStatus.PENDING);
    }
}