package com.resource.booking.Controller;

import com.resource.booking.Service.AuthService;
import com.resource.booking.dto.*;
import com.resource.booking.entity.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ❌ SIGNUP DISABLED
    @PostMapping("/signup")
    public String signup(@RequestBody SignupRequestDTO dto) {
        return "Signup is disabled. Use predefined login credentials.";
    }

    // ================= USER LOGIN =================
    @PostMapping("/login/user")
    public AuthResponseDTO userLogin(@RequestBody LoginRequestDTO dto) {
        return authService.login(dto, Role.USER);
    }

    // ================= ADMIN SEMINAR LOGIN =================
    @PostMapping("/login/admin-seminar")
    public AuthResponseDTO adminSeminarLogin(@RequestBody LoginRequestDTO dto) {
        return authService.login(dto, Role.ADMIN_SEMINAR);
    }

    // ================= ADMIN RESOURCE LOGIN =================
    @PostMapping("/login/admin-resource")
    public AuthResponseDTO adminResourceLogin(@RequestBody LoginRequestDTO dto) {
        return authService.login(dto, Role.ADMIN_RESOURCE);
    }

    // ================= FORGOT PASSWORD =================
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgetPasswordRequestDTO dto) {
        authService.forgotPassword(dto.getEmail());
        return ResponseEntity.ok("Password reset link sent to email");
    }

    // ================= RESET PASSWORD =================
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequestDTO dto) {
        authService.resetPassword(
                dto.getToken(),
                dto.getNewPassword(),
                dto.getConfirmPassword()
        );
        return ResponseEntity.ok("Password reset successful");
    }
}