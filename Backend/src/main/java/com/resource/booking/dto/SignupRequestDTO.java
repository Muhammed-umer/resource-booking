package com.resource.booking.dto;

import com.resource.booking.entity.Department;
import com.resource.booking.entity.Role;
import java.util.List; // Import List

public class SignupRequestDTO {
    public String email;
    public String password;
    public String name;
    public Role role;
    public Department department; // Can be null for Admins

    // NEW FIELD to receive the checkbox data from React
    public List<String> managedFacilities;
}