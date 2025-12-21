package com.resource.booking.repository;
import com.resource.booking.entity.GuestHouse;
import com.resource.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GuestHouseRepository extends JpaRepository<GuestHouse, Long> {

        // ⿡ Find bookings by status (Admin filter)
        List<GuestHouse> findByStatus(BookingStatus status);

        // ⿢ Find bookings by room number
        List<GuestHouse> findByRoomNumber(int roomNumber);

        // ⿣ Check date overlap for same room (IMPORTANT)
        List<GuestHouse> findByRoomNumberAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                int roomNumber,
                LocalDate toDate,
                LocalDate fromDate
        );
}

