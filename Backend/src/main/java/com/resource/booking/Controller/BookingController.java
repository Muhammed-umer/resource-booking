package com.resource.booking.Controller;

import com.resource.booking.Service.BookingService;
import com.resource.booking.entity.Booking;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.data.projection.EntityProjection.ProjectionType.DTO;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ---------------- Create Booking ----------------
    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            Booking savedBooking = bookingService.createBooking(booking);
            return ResponseEntity.ok(savedBooking);
        } catch (IllegalArgumentException e) {
            // This sends the "Already booked by CSE..." message to the frontend
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ---------------- Admin: View All ----------------
    @PreAuthorize("hasRole('ADMIN_SEMINAR') or hasRole('ADMIN_RESOURCE')")
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // ---------------- Admin: View by Facility ----------------
    @PreAuthorize("hasRole('ADMIN_SEMINAR') or hasRole('ADMIN_RESOURCE')")
    @GetMapping("/facility/{type}")
    public List<Booking> getByFacility(@PathVariable String type) {
        return bookingService.getBookingsByFacility(type);
    }

    // ---------------- Admin: Approve Booking ----------------
    @PreAuthorize("(hasRole('ADMIN_SEMINAR') and #facilityType == 'SEMINAR_HALL') or " +
            "(hasRole('ADMIN_RESOURCE') and (#facilityType == 'AUDITORIUM' or #facilityType == 'GUEST_HOUSE'))")
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable Long id, @RequestParam String facilityType) {
        Booking approved = bookingService.approveBooking(id);
        return ResponseEntity.ok(approved);
    }

    // ---------------- Admin: Reject Booking ----------------
    @PreAuthorize("(hasRole('ADMIN_SEMINAR') and #facilityType == 'SEMINAR_HALL') or " +
            "(hasRole('ADMIN_RESOURCE') and (#facilityType == 'AUDITORIUM' or #facilityType == 'GUEST_HOUSE'))")
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable Long id, @RequestParam String facilityType) {
        Booking rejected = bookingService.rejectBooking(id);
        return ResponseEntity.ok(rejected);

    }
}