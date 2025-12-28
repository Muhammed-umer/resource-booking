package com.resource.booking.Service;

import com.resource.booking.entity.*;
import com.resource.booking.repository.AuditLogRepository;
import com.resource.booking.repository.GuestHouseRepository;
import com.resource.booking.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuestHouseService {

    private final GuestHouseRepository guestHouseRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public GuestHouseService(GuestHouseRepository guestHouseRepository,
                             UserRepository userRepository,
                             AuditLogRepository auditLogRepository) {
        this.guestHouseRepository = guestHouseRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public GuestHouse saveBooking(GuestHouse guestHouse) {
        // ... (Keep existing conflict check logic) ...
        List<GuestHouse> conflicts = guestHouseRepository.findByRoomNumberAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                guestHouse.getRoomNumber(), guestHouse.getToDate(), guestHouse.getFromDate());

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Room " + guestHouse.getRoomNumber() + " is already booked.");
        }
        guestHouse.setStatus(BookingStatus.PENDING);
        return guestHouseRepository.save(guestHouse);
    }

    public List<GuestHouse> getAllBookings() { return guestHouseRepository.findAll(); }

    public GuestHouse getBookingById(Long id) {
        return guestHouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    }

    // --- APPROVE ---
    public GuestHouse approveBooking(Long id) {
        GuestHouse booking = getBookingById(id);
        validatePermission();

        booking.setStatus(BookingStatus.APPROVED);
        GuestHouse saved = guestHouseRepository.save(booking);

        logAction("APPROVED", "Approved Guest House Room " + booking.getRoomNumber());
        return saved;
    }

    // --- REJECT ---
    public GuestHouse rejectBooking(Long id) {
        GuestHouse booking = getBookingById(id);
        validatePermission();

        booking.setStatus(BookingStatus.REJECTED);
        GuestHouse saved = guestHouseRepository.save(booking);

        logAction("REJECTED", "Rejected Guest House Room " + booking.getRoomNumber());
        return saved;
    }

    // Helper: Guest House Permission Check
    private void validatePermission() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        if (admin.getRole() == Role.OWNER) return;

        // Check if admin has GUEST_HOUSE permission
        if (admin.getManagedFacilities() == null || !admin.getManagedFacilities().contains(FacilityType.GUEST_HOUSE)) {
            throw new RuntimeException("You do not have permission to manage Guest House");
        }
    }

    private void logAction(String action, String details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setDetails(details);
        log.setPerformedBy(email);
        auditLogRepository.save(log);
    }
}