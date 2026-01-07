package com.resource.booking.entity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "guest_house_bookings")

public class GuestHouse {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long bookingId;

        // ---------- Guest Details ----------
        @Column(nullable = false)
        private String guestName;

        @Column(nullable = false)
        private String phoneNumber;

//        @Column(nullable = false)
//        private String email;   // 📧 Email for notification

        private String purpose;

        // ---------- Stay Dates ----------
        @JsonFormat(pattern = "yyyy-MM-dd")
        @Column(nullable = false)
        private LocalDate fromDate;

        @JsonFormat(pattern = "yyyy-MM-dd")
        @Column(nullable = false)
        private LocalDate toDate;

        @JsonFormat(pattern = "HH:mm:ss")
        private LocalTime checkInTime;
        private LocalTime checkOutTime;

        // ---------- Room ----------
        @Column(nullable = false)
        private int roomNumber;

        // ---------- Booking Status ----------
        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private BookingStatus status;

        // ---------- Requested By ----------
        @Column(nullable = false)
        private String requestedBy;

        // ---------- Fees ----------
        private Double fees;

        // ---------- Created Time ----------
        @Column(nullable = false)
        private LocalDateTime createdAt;

        // ---------- Auto Set Values ----------
        @PrePersist
        public void prePersist() {
            this.createdAt = LocalDateTime.now();
            this.status = BookingStatus.PENDING;
        }

        // ---------- Getters & Setters ----------

        public Long getBookingId() {
            return bookingId;
        }

        public String getGuestName() {
            return guestName;
        }

        public void setGuestName(String guestName) {
            this.guestName = guestName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

//        public String getEmail() {
//            return email;
//        }
//
//        public void setEmail(String email) {
//            this.email = email;
//        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public LocalDate getFromDate() {
            return fromDate;
        }

        public void setFromDate(LocalDate fromDate) {
            this.fromDate = fromDate;
        }

        public LocalDate getToDate() {
            return toDate;
        }

        public void setToDate(LocalDate toDate) {
            this.toDate = toDate;
        }

        public LocalTime getCheckInTime() {
            return checkInTime;
        }

        public void setCheckInTime(LocalTime checkInTime) {
            this.checkInTime = checkInTime;
        }

        public LocalTime getCheckOutTime() {
            return checkOutTime;
        }

        public void setCheckOutTime(LocalTime checkOutTime) {
            this.checkOutTime = checkOutTime;
        }

        public int getRoomNumber() {
            return roomNumber;
        }

        public void setRoomNumber(int roomNumber) {
            this.roomNumber = roomNumber;
        }

        public BookingStatus getStatus() {
            return status;
        }

        public void setStatus(BookingStatus status) {
            this.status = status;
        }

        public String getRequestedBy() {
            return requestedBy;
        }

        public void setRequestedBy(String requestedBy) {
            this.requestedBy = requestedBy;
        }

        public Double getFees() {
            return fees;
        }

        public void setFees(Double fees) {
            this.fees = fees;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
    }
