package com.resource.booking.Service;

import com.resource.booking.dto.CalendarDayStatusDTO;
import com.resource.booking.entity.Booking;
import com.resource.booking.entity.FacilityType;
import com.resource.booking.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class CalendarService {

    private final BookingRepository bookingRepository;

    public CalendarService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public List<CalendarDayStatusDTO> getCalendarStatus(LocalDate startDate, LocalDate endDate) {

        List<CalendarDayStatusDTO> result = new ArrayList<>();
        List<Booking> bookings = bookingRepository.findBookingsBetweenDates(startDate, endDate);

        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {

            boolean seminarBooked = false;
            boolean auditoriumBooked = false;
            boolean guestHouseBooked = false;

            for (Booking booking : bookings) {
                if (booking.getFromDate().isAfter(date) || booking.getToDate().isBefore(date)) {
                    continue; // Only consider bookings that cover this date
                }

                if (booking.getFacilityType() == FacilityType.SEMINAR_HALL) {
                    seminarBooked = true;
                }
                if (booking.getFacilityType() == FacilityType.AUDITORIUM) {
                    auditoriumBooked = true;
                }
                if (booking.getFacilityType() == FacilityType.GUEST_HOUSE) {
                    guestHouseBooked = true;
                }
            }

            // Convert boolean to "BOOKED" / "AVAILABLE" string
            CalendarDayStatusDTO dto = new CalendarDayStatusDTO(
                    date,
                    seminarBooked ? "BOOKED" : "AVAILABLE",
                    auditoriumBooked ? "BOOKED" : "AVAILABLE",
                    guestHouseBooked ? "BOOKED" : "AVAILABLE"
            );

            result.add(dto);
            date = date.plusDays(1);
        }

        return result;
    }

}
