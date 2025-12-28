package com.resource.booking.Controller;

import com.resource.booking.Service.AuthService;
import com.resource.booking.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public String signup(@RequestBody SignupRequestDTO dto) {
        return authService.signup(dto);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequestDTO dto) {
        return authService.login(dto);
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @RequestBody ForgetPasswordRequestDTO dto) {

        authService.forgotPassword(dto.getEmail());
        return ResponseEntity.ok("Password reset link sent to email");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestBody ResetPasswordRequestDTO dto) {

        authService.resetPassword(
                dto.getToken(),
                dto.getNewPassword(),
                dto.getConfirmPassword()
        );

        return ResponseEntity.ok("Password reset successful");
    }
}


