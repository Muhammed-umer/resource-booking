package com.resource.booking.dto;

import com.resource.booking.entity.Department;
import com.resource.booking.entity.Role;

public class SignupRequestDTO {
    public String email;
    public String password;
    public Department department; // only for USER
    public String name; // only for ADMIN
    public Role role;

}
