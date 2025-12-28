package com.resource.booking.Controller;

import com.resource.booking.Service.BookingService; // Use Service, not Repo directly
import com.resource.booking.entity.Booking;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class BookingController {

    private final BookingService bookingService;
    private final SimpMessagingTemplate messagingTemplate;

    public BookingController(BookingService bookingService, SimpMessagingTemplate messagingTemplate) {
        this.bookingService = bookingService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/request")
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            // Use Service to handle conflict checks & saving
            Booking savedBooking = bookingService.createBooking(booking);

            // Send WebSocket update
            messagingTemplate.convertAndSend("/topic/bookings", savedBooking);

            return ResponseEntity.ok("Booking requested successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(e.getMessage()); // 409 Conflict
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing request");
        }
    }

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }
}