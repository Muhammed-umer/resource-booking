package com.resource.booking.Service;

import com.resource.booking.dto.BookingRequest;
import com.resource.booking.entity.*;
import com.resource.booking.repository.BookingRepository;
import com.resource.booking.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public BookingService(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            EmailService emailService

    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // ---------------- Create Booking ----------------
    public Booking createBooking(BookingRequest bookingRequest, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = new Booking();
        booking.setEventName(bookingRequest.getEventName());
        booking.setFacilityType(bookingRequest.getFacilityType());
        booking.setFromDate(bookingRequest.getFromDate());
        booking.setToDate(bookingRequest.getToDate());
        booking.setStartTime(bookingRequest.getStartTime());
        booking.setEndTime(bookingRequest.getEndTime());
        booking.setRequestedBy(email);
        booking.setDepartment(user.getDepartment().name());

        List<Booking> conflicts = bookingRepository.findConflicts(
                booking.getFacilityType(),
                booking.getFromDate(),
                booking.getToDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            Booking blocker = conflicts.get(0);
            throw new IllegalArgumentException(
                    "Already booked by " + blocker.getDepartment() + " for '" + blocker.getEventName() + "'"
            );
        }

        booking.setBookingStatus(BookingStatus.PENDING);
        Booking savedBooking = bookingRepository.save(booking);


        try {
            String adminEmail = "pavithramalini0612@gmail.com";
            String subject = "New Booking Request: " + savedBooking.getFacilityType();
            String body = "Hello Admin,\n\nA new booking request has been received.\n" +
                    "User: " + email + "\n" +
                    "Facility: " + savedBooking.getFacilityType() + "\n" +
                    "Event: " + savedBooking.getEventName() + "\n" +
                    "Date: " + savedBooking.getFromDate() + " to " + savedBooking.getToDate();

            emailService.sendEmail(adminEmail, subject, body);
        } catch (Exception e) {
            // This prevents the whole booking from failing if the email server is down
            System.out.println("Email failed to send, but booking was saved: " + e.getMessage());
        }

        // 3. Return the variable
        return savedBooking;
    }

    // ---------------- Get All Bookings ----------------
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ---------------- Get By Facility ----------------
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
    public Booking rejectBooking(Long id, String adminMessage) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setBookingStatus(BookingStatus.REJECTED);
        booking.setAdminMessage(adminMessage);
        return bookingRepository.save(booking);
    }

    // ---------------- Get Booking History for Logged-in User ----------------
    public List<Booking> getUserBookingHistory(String email) {
        return bookingRepository.findByRequestedByOrderByFromDateDesc(email);
    }

    public List<Booking> getPendingBookings(String facilityTypeStr) {
        FacilityType type = FacilityType.valueOf(facilityTypeStr);
        // Use the method we just created in Step 1.1
        return bookingRepository.findByFacilityTypeAndBookingStatus(type, BookingStatus.PENDING);
    }
}