package com.resource.booking.dto;

import lombok.Getter;

@Getter
public class LoginRequestDTO {
    private String email;
    private String password;

    public LoginRequestDTO() {}

    public String setEmail(String email) {
        this.email = email;
        return email;
    }

    public String setPassword(String password) {
        this.password = password;
        return password;
    }

}
