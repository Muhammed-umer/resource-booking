package com.resource.booking.Controller;
import com.resource.booking.Service.BookingService;
import com.resource.booking.entity.Booking;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

        private final BookingService bookingService;

        public BookingController(BookingService bookingService) {
            this.bookingService = bookingService;
        }

        // Student creates booking
        @PostMapping
        public Booking createBooking(@RequestBody Booking booking) {
            return bookingService.createBooking(booking);
        }

        // Admin view all bookings
        @GetMapping
        public List<Booking> getAllBookings() {
            return bookingService.getAllBookings();
        }

        // Admin view by facility
        @GetMapping("/facility/{type}")
        public List<Booking> getByFacility(@PathVariable String type) {
            return bookingService.getBookingsByFacility(type);
        }
    }

