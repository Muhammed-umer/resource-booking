package com.resource.booking.Controller;

import com.resource.booking.dto.CalendarDayStatusDTO;
import com.resource.booking.Service.CalendarService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public List<CalendarDayStatusDTO> getCalendar(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return calendarService.getCalendarStatus(startDate, endDate);
    }
}
