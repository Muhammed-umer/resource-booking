package com.resource.booking.repository;

import com.resource.booking.entity.Booking;
import com.resource.booking.entity.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByFacilityType(FacilityType facilityType);

    List<Booking> findByDepartmentOrderByFromDateDesc(String department);

    // ✅ This is the missing method for user booking history
    List<Booking> findByRequestedByOrderByFromDateDesc(String requestedBy);

    @Query("SELECT b FROM Booking b WHERE b.facilityType = :facility AND b.bookingStatus = 'APPROVED' " +
            "AND (b.fromDate <= :toDate AND b.toDate >= :fromDate) " +
            "AND (b.startTime < :endTime AND b.endTime > :startTime)")
    List<Booking> findConflicts(
            @Param("facility") FacilityType facility,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("SELECT b FROM Booking b WHERE b.fromDate <= :endDate AND b.toDate >= :startDate")
    List<Booking> findBookingsBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<Booking> findByDepartment(String department);
}