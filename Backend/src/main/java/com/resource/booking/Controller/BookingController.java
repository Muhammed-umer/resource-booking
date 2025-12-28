package com.resource.booking.Controller;

import com.resource.booking.Service.BookingService;
import com.resource.booking.entity.Booking;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ---------------- Create Booking ----------------
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
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // ---------------- Admin: View by Facility ----------------
    @GetMapping("/facility/{type}")
    public List<Booking> getByFacility(@PathVariable String type) {
        return bookingService.getBookingsByFacility(type);
    }
}
