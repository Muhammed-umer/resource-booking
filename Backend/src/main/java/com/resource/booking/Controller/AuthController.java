package com.resource.booking.Controller;

import com.resource.booking.Service.AuthService;
import com.resource.booking.dto.AuthResponseDTO;
import com.resource.booking.dto.LoginRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Standard Login
    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequestDTO dto) {
        return authService.login(dto.getEmail(), dto.getPassword());
    }

    // Google Login
    @PostMapping("/google")
    public AuthResponseDTO googleLogin(@RequestBody Map<String, String> payload) {
        return authService.loginWithGoogle(payload.get("token"));
    }

    // Initial Setup (Call this once via Postman/Curl)
    @PostMapping("/create-initial-owner")
    public String createOwner(@RequestBody LoginRequestDTO dto) {
        return authService.createInitialOwner(dto.getEmail(), dto.getPassword());
    }
}