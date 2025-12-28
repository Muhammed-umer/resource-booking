package com.resource.booking.repository;

import com.resource.booking.entity.Booking;
import com.resource.booking.entity.BookingStatus;
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

    // Correct Enum-based finders
    List<Booking> findByFacilityTypeAndBookingStatus(FacilityType facilityType, BookingStatus bookingStatus);

    List<Booking> findByFacilityTypeAndBookingStatusNot(FacilityType facilityType, BookingStatus bookingStatus);

    List<Booking> findByFacilityType(FacilityType facilityType);

    @Query("SELECT b FROM Booking b WHERE b.fromDate <= :endDate AND b.toDate >= :startDate")
    List<Booking> findBookingsBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Conflict Checker
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
}