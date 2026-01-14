package com.resource.booking.dto;

import com.resource.booking.entity.FacilityType;
import java.time.LocalDate;
import java.time.LocalTime;

public class BookingRequest {

    private FacilityType facilityType;
    private String eventName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private String requestedBy; // optional, can be empty

    // Getters and Setters
    public FacilityType getFacilityType() { return facilityType; }
    public void setFacilityType(FacilityType facilityType) { this.facilityType = facilityType; }
    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
}