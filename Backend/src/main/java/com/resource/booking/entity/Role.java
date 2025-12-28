package com.resource.booking.entity;

public enum Role {
    USER,
    ADMIN, // One generic admin role, permissions defined in User entity
    OWNER  // Super Admin
}