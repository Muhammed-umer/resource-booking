package com.resource.booking.Service;

import com.resource.booking.dto.CalendarDayStatusDTO;
import com.resource.booking.entity.Booking;
import com.resource.booking.entity.GuestHouse;
import com.resource.booking.entity.FacilityType;
import com.resource.booking.repository.BookingRepository;
import com.resource.booking.repository.GuestHouseRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CalendarService {

    private final BookingRepository bookingRepository;
    private final GuestHouseRepository guestHouseRepository;

    // Define the Midday Cutoff (1:00 PM)
    private static final LocalTime MIDDAY = LocalTime.of(13, 0);

    public CalendarService(BookingRepository bookingRepository, GuestHouseRepository guestHouseRepository) {
        this.bookingRepository = bookingRepository;
        this.guestHouseRepository = guestHouseRepository;
    }

    public List<CalendarDayStatusDTO> getCalendarStatus(LocalDate startDate, LocalDate endDate) {
        List<CalendarDayStatusDTO> result = new ArrayList<>();

        List<Booking> bookings = bookingRepository.findBookingsBetweenDates(startDate, endDate);
        List<GuestHouse> ghBookings = guestHouseRepository.findAll();

        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {

            // We use generic strings: "AVAILABLE", "FULL", "FN", "AN"
            String seminarStatus = "AVAILABLE";
            String auditoriumStatus = "AVAILABLE";
            String guestHouseStatus = "AVAILABLE";

            // 1. Check Halls (Auditorium & Seminar)
            for (Booking b : bookings) {
                // Skip if booking doesn't cover this date
                if (b.getFromDate().isAfter(date) || b.getToDate().isBefore(date)) continue;

                // Calculate Status (FN/AN/FULL)
                String status = calculateDailyStatus(date, b.getFromDate(), b.getToDate(), b.getStartTime(), b.getEndTime());

                if (b.getFacilityType() == FacilityType.SEMINAR_HALL) {
                    seminarStatus = mergeStatus(seminarStatus, status);
                } else if (b.getFacilityType() == FacilityType.AUDITORIUM) {
                    auditoriumStatus = mergeStatus(auditoriumStatus, status);
                }
            }

            // 2. Check Guest House
            for (GuestHouse gh : ghBookings) {
                if (gh.getFromDate().isAfter(date) || gh.getToDate().isBefore(date)) continue;

                // GuestHouse uses checkIn/checkOut times
                String status = calculateDailyStatus(date, gh.getFromDate(), gh.getToDate(), gh.getCheckInTime(), gh.getCheckOutTime());
                guestHouseStatus = mergeStatus(guestHouseStatus, status);
            }

            result.add(new CalendarDayStatusDTO(date, seminarStatus, auditoriumStatus, guestHouseStatus));
            date = date.plusDays(1);
        }

        return result;
    }

    // Helper: Determine if a specific booking is FN, AN, or FULL for a specific date
    private String calculateDailyStatus(LocalDate currentDate, LocalDate start, LocalDate end, LocalTime timeIn, LocalTime timeOut) {

        boolean isStartDay = currentDate.equals(start);
        boolean isEndDay = currentDate.equals(end);

        // Case 1: Middle days of a multi-day booking are always FULL
        if (!isStartDay && !isEndDay) return "FULL";

        boolean touchesMorning = false;
        boolean touchesAfternoon = false;

        // Logic for Single Day Booking
        if (isStartDay && isEndDay) {
            if (timeIn.isBefore(MIDDAY)) touchesMorning = true;
            if (timeOut.isAfter(MIDDAY)) touchesAfternoon = true;
        }
        // Logic for Start Day of Multi-day
        else if (isStartDay) {
            // If starts before 1 PM, it covers morning. It definitely covers afternoon (since it goes to next day)
            if (timeIn.isBefore(MIDDAY)) touchesMorning = true;
            touchesAfternoon = true;
        }
        // Logic for End Day of Multi-day
        else if (isEndDay) {
            // It definitely covers morning (since it came from yesterday).
            touchesMorning = true;
            // If ends after 1 PM, it covers afternoon
            if (timeOut.isAfter(MIDDAY)) touchesAfternoon = true;
        }

        if (touchesMorning && touchesAfternoon) return "FULL";
        if (touchesMorning) return "FN";
        if (touchesAfternoon) return "AN";
        return "AVAILABLE";
    }

    // Helper: Merge existing status with new status (e.g., if one booking is FN and another is AN, result is FULL)
    private String mergeStatus(String current, String newStatus) {
        if (current.equals("FULL") || newStatus.equals("FULL")) return "FULL";
        if (current.equals("AVAILABLE")) return newStatus;
        if (current.equals("FN") && newStatus.equals("AN")) return "FULL";
        if (current.equals("AN") && newStatus.equals("FN")) return "FULL";
        return current; // If both are FN or both are AN, return that
    }
}