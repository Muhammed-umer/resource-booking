package com.resource.booking.Controller;

import com.resource.booking.entity.GuestHouse;
import com.resource.booking.Service.GuestHouseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/guesthouse")
public class GuestHouseController {

    private final GuestHouseService guestHouseService;

    public GuestHouseController(GuestHouseService guestHouseService) {
        this.guestHouseService = guestHouseService;
    }

    // ---------------- Book Guest House ----------------
    @PostMapping("/book")
    public ResponseEntity<?> bookGuestHouse(@RequestBody GuestHouse guestHouse) {
        try {
            GuestHouse savedBooking = guestHouseService.saveBooking(guestHouse);
            return new ResponseEntity<>(savedBooking, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            // Sends: "Room 101 is already booked by John Doe..."
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ---------------- Get All Bookings (Admin) ----------------
    @GetMapping("/all")
    public ResponseEntity<List<GuestHouse>> getAllBookings() {
        return ResponseEntity.ok(guestHouseService.getAllBookings());
    }

    // ---------------- Get Booking by ID ----------------
    @GetMapping("/{id}")
    public ResponseEntity<GuestHouse> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(guestHouseService.getBookingById(id));
    }

    // ---------------- Approve Booking ----------------
    @PutMapping("/approve/{id}")
    public ResponseEntity<GuestHouse> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(guestHouseService.approveBooking(id));
    }

    // ---------------- Reject Booking ----------------
    @PutMapping("/reject/{id}")
    public ResponseEntity<GuestHouse> rejectBooking(@PathVariable Long id) {
        return ResponseEntity.ok(guestHouseService.rejectBooking(id));
    }
}