package com.resource.booking.Controller;

import com.resource.booking.Service.BookingService;
import com.resource.booking.dto.BookingRequest;
import com.resource.booking.entity.Booking;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody BookingRequest bookingRequest,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            Booking savedBooking = bookingService.createBooking(bookingRequest, email);
            return ResponseEntity.ok(savedBooking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN_SEMINAR') or hasRole('ADMIN_RESOURCE')")
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @PreAuthorize("hasRole('ADMIN_SEMINAR') or hasRole('ADMIN_RESOURCE')")
    @GetMapping("/facility/{type}")
    public List<Booking> getByFacility(@PathVariable String type) {
        return bookingService.getBookingsByFacility(type);
    }

    @PreAuthorize("(hasRole('ADMIN_SEMINAR') and #facilityType == 'SEMINAR_HALL') or " +
            "(hasRole('ADMIN_RESOURCE') and (#facilityType == 'AUDITORIUM' or #facilityType == 'GUEST_HOUSE'))")
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(
            @PathVariable Long id,
            @RequestParam String facilityType
    ) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PreAuthorize("(hasRole('ADMIN_SEMINAR') and #facilityType == 'SEMINAR_HALL') or " +
            "(hasRole('ADMIN_RESOURCE') and (#facilityType == 'AUDITORIUM' or #facilityType == 'GUEST_HOUSE'))")
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(
            @PathVariable Long id,
            @RequestParam String facilityType,
            @RequestBody(required = false) String adminMessage
    ) {
        return ResponseEntity.ok(
                bookingService.rejectBooking(id, adminMessage)
        );
    }

    // ---------------- User Booking History ----------------
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/history")
    public ResponseEntity<List<Booking>> getUserBookingHistory(Authentication authentication) {
        String email = authentication.getName();
        List<Booking> history = bookingService.getUserBookingHistory(email);
        return ResponseEntity.ok(history);
    }
}