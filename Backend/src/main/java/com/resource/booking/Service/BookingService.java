package com.resource.booking.Service;

import com.resource.booking.entity.*;
import com.resource.booking.repository.AuditLogRepository;
import com.resource.booking.repository.BookingRepository;
import com.resource.booking.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;         // NEW
    private final AuditLogRepository auditLogRepository; // NEW

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          AuditLogRepository auditLogRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // --- Create Booking (No Changes needed here) ---
    public Booking createBooking(Booking booking) {
        List<Booking> conflicts = bookingRepository.findConflicts(
                booking.getFacilityType(), booking.getFromDate(), booking.getToDate(),
                booking.getStartTime(), booking.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            Booking blocker = conflicts.get(0);
            throw new IllegalArgumentException("Already booked by " + blocker.getDepartment());
        }
        booking.setBookingStatus(BookingStatus.PENDING);
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() { return bookingRepository.findAll(); }

    public List<Booking> getBookingsByFacility(String facilityTypeStr) {
        return bookingRepository.findByFacilityType(FacilityType.valueOf(facilityTypeStr));
    }

    // --- APPROVE WITH PERMISSION CHECK & LOGGING ---
    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 1. Validate Permission
        validateAdminPermission(booking.getFacilityType());

        // 2. Perform Action
        booking.setBookingStatus(BookingStatus.APPROVED);
        Booking saved = bookingRepository.save(booking);

        // 3. Log to History
        logAction("APPROVED", "Approved booking #" + id + " for " + booking.getFacilityType());

        return saved;
    }

    // --- REJECT WITH PERMISSION CHECK & LOGGING ---
    public Booking rejectBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateAdminPermission(booking.getFacilityType());

        booking.setBookingStatus(BookingStatus.REJECTED);
        Booking saved = bookingRepository.save(booking);

        logAction("REJECTED", "Rejected booking #" + id + " for " + booking.getFacilityType());

        return saved;
    }

    // --- HELPER: CHECK IF USER IS OWNER OR HAS PERMISSION ---
    private void validateAdminPermission(FacilityType facility) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If OWNER, allow everything.
        if (admin.getRole() == Role.OWNER) return;

        // If ADMIN, check if they manage this specific facility
        if (admin.getManagedFacilities() == null || !admin.getManagedFacilities().contains(facility)) {
            throw new RuntimeException("You do not have permission to manage " + facility);
        }
    }

    // --- HELPER: SAVE LOG ---
    private void logAction(String action, String details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setDetails(details);
        log.setPerformedBy(email);
        auditLogRepository.save(log);
    }
}