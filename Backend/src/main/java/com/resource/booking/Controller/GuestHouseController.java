package com.resource.booking.Controller;

import com.resource.booking.entity.GuestHouse;
import com.resource.booking.Service.GuestHouseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication; // ✅ 1. Import this

import java.util.List;

@RestController
@RequestMapping("/guesthouse")
public class GuestHouseController {

    private final GuestHouseService guestHouseService;

    public GuestHouseController(GuestHouseService guestHouseService) {
        this.guestHouseService = guestHouseService;
    }

    // ---------------- Book Guest House ----------------
    @PreAuthorize("hasRole('USER')")
    @PostMapping("/book")
    public ResponseEntity<?> bookGuestHouse(
            @RequestBody GuestHouse guestHouse,
            Authentication authentication // ✅ 2. Add this parameter
    ) {
        try {
            // ✅ 3. FORCE the email from the logged-in user's Token
            String email = authentication.getName();
            guestHouse.setRequestedBy(email);

            GuestHouse savedBooking = guestHouseService.saveBooking(guestHouse);
            return new ResponseEntity<>(savedBooking, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ... (Keep the rest of the file the same)

    // ---------------- Get All Bookings (Admin) ----------------
    @PreAuthorize("hasRole('ADMIN_RESOURCE')")
    @GetMapping("/all")
    public ResponseEntity<List<GuestHouse>> getAllBookings() {
        return ResponseEntity.ok(guestHouseService.getAllBookings());
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN_RESOURCE')")
    @GetMapping("/{id}")
    public ResponseEntity<GuestHouse> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(guestHouseService.getBookingById(id));
    }

    @PreAuthorize("hasRole('ADMIN_RESOURCE')")
    @PutMapping("/approve/{id}")
    public ResponseEntity<GuestHouse> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(guestHouseService.approveBooking(id));
    }

    @PreAuthorize("hasRole('ADMIN_RESOURCE')")
    @PutMapping("/reject/{id}")
    public ResponseEntity<GuestHouse> rejectBooking(@PathVariable Long id) {
        return ResponseEntity.ok(guestHouseService.rejectBooking(id));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/history")
    public ResponseEntity<List<GuestHouse>> getUserHistory(Authentication authentication) {
        return ResponseEntity.ok(guestHouseService.getUserGuestHouseHistory(authentication.getName()));
    }

    @PreAuthorize("hasRole('ADMIN_RESOURCE')")
    @GetMapping("/pending")
    public ResponseEntity<List<GuestHouse>> getPending() {
        return ResponseEntity.ok(guestHouseService.getPendingBookings());
    }
}