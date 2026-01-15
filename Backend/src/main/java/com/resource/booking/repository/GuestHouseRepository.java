package com.resource.booking.repository;
import com.resource.booking.entity.GuestHouse;
import com.resource.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GuestHouseRepository extends JpaRepository<GuestHouse, Long> {

        // 1. For Admins: Find specific status (e.g., PENDING)
        List<GuestHouse> findByStatus(BookingStatus status);

        // 2. For Users: Find their own history
        List<GuestHouse> findByRequestedBy(String requestedBy);



        // ⿢ Find bookings by room number
        List<GuestHouse> findByRoomNumber(int roomNumber);

        // ⿣ Check date overlap for same room (IMPORTANT)
        List<GuestHouse> findByRoomNumberAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                int roomNumber,
                LocalDate toDate,
                LocalDate fromDate
        );
}

