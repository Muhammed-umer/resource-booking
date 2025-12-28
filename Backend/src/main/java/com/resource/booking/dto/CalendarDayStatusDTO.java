package com.resource.booking.dto;

import java.time.LocalDate;

public class CalendarDayStatusDTO {

    private LocalDate date;
    private String seminarHallStatus;
    private String auditoriumStatus;
    private String guestHouseStatus;

    public CalendarDayStatusDTO() {}

    public CalendarDayStatusDTO(LocalDate date,
                                String seminarHallStatus,
                                String auditoriumStatus,
                                String guestHouseStatus) {
        this.date = date;
        this.seminarHallStatus = seminarHallStatus;
        this.auditoriumStatus = auditoriumStatus;
        this.guestHouseStatus = guestHouseStatus;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getSeminarHallStatus() {
        return seminarHallStatus;
    }

    public void setSeminarHallStatus(String seminarHallStatus) {
        this.seminarHallStatus = seminarHallStatus;
    }

    public String getAuditoriumStatus() {
        return auditoriumStatus;
    }

    public void setAuditoriumStatus(String auditoriumStatus) {
        this.auditoriumStatus = auditoriumStatus;
    }

    public String getGuestHouseStatus() {
        return guestHouseStatus;
    }

    public void setGuestHouseStatus(String guestHouseStatus) {
        this.guestHouseStatus = guestHouseStatus;
    }
}
