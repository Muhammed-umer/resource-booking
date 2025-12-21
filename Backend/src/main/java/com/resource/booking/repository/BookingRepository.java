package com.resource.booking.repository;

import com.resource.booking.entity.Booking;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.resource.booking.entity.BookingStatus;
import com.resource.booking.entity.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

@Repository
     public interface BookingRepository extends JpaRepository<Booking, Long> {

        // ⿡ Get all bookings by facility type (AUDITORIUM or SEMINAR_HALL)
        List<Booking> findByFacilityType(FacilityType facilityType);

        // ⿢ Get all bookings by booking status (PENDING, APPROVED, REJECTED)
        List<Booking> findByBookingStatus(BookingStatus status);

        // ⿣ Check for bookings on a specific date for a facility
        List<Booking> findByFacilityTypeAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                FacilityType facilityType, LocalDate toDate, LocalDate fromDate);

        // ⿤ Get bookings for a specific department
        List<Booking> findByDepartment(String department);

        // ⿥ Get bookings by facility type and status (used in time clash check)
        List<Booking>findByFacilityTypeAndBookingStatus(FacilityType facilityType,BookingStatus status);
    }


