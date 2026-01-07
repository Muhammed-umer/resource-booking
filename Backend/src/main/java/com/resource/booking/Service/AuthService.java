package com.resource.booking.Service;

import com.resource.booking.dto.*;
import com.resource.booking.entity.*;
import com.resource.booking.repository.PasswordResetTokenRepository;
import com.resource.booking.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public AuthService(UserRepository userRepo,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailService emailService) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    // ================= LOGIN =================
    public AuthResponseDTO login(LoginRequestDTO dto, Role expectedRole) {

        User user = userRepo.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid password");

        // 🔴 PREVENT ROLE SWITCHING
        if (user.getRole() != expectedRole)
            throw new RuntimeException("Access denied for this login");

        // 🔒 USER EMAIL VALIDATION
        if (expectedRole == Role.USER) {
            switch (user.getDepartment()) {
                case CSE -> validate(dto, "cse@example.com");
                case EEE -> validate(dto, "eee@example.com");
                case ECE -> validate(dto, "ece@example.com");
                case CIVIL -> validate(dto, "civil@example.com");
                case MECHANICAL -> validate(dto, "mech@example.com");
                case AUTOMOBILE -> validate(dto, "auto@example.com");
                case IT -> validate(dto, "it@example.com");
            }
        }

        // 🔒 ADMIN EMAIL VALIDATION
        if (expectedRole == Role.ADMIN_SEMINAR)
            validate(dto, "seminaradmin@example.com");

        if (expectedRole == Role.ADMIN_RESOURCE)
            validate(dto, "resourceadmin@example.com");

        String token = jwtService.generateToken(user);

        AuthResponseDTO response = new AuthResponseDTO();
        response.token = token;
        response.role = user.getRole().name();
        return response;
    }

    private void validate(LoginRequestDTO dto, String allowedEmail) {
        if (!dto.getEmail().equals(allowedEmail))
            throw new RuntimeException("Invalid email for this role");
    }

    // ================= FORGOT PASSWORD =================
    public void forgotPassword(String email) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        passwordResetTokenRepository.findByUser(user)
                .ifPresent(passwordResetTokenRepository::delete);

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(new Date(System.currentTimeMillis() + 3600000));

        passwordResetTokenRepository.save(resetToken);

        emailService.sendEmail(
                user.getEmail(),
                "Reset Password",
                "Click here to reset password: http://localhost:8082/reset-password?token=" + token
        );
    }

    // ================= RESET PASSWORD =================
    public void resetPassword(String token, String newPassword, String confirmPassword) {

        if (!newPassword.equals(confirmPassword))
            throw new RuntimeException("Passwords do not match");

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.getExpiryDate().before(new Date()))
            throw new RuntimeException("Token expired");

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    // ================= CREATE DUMMY USERS =================
    @PostConstruct
    public void createDummyUsers() {

        create("cse@example.com", "password123", Role.USER, Department.CSE);
        create("eee@example.com", "password123", Role.USER, Department.EEE);
        create("ece@example.com", "password123", Role.USER, Department.ECE);
        create("civil@example.com", "password123", Role.USER, Department.CIVIL);
        create("mech@example.com", "password123", Role.USER, Department.MECHANICAL);
        create("auto@example.com", "password123", Role.USER, Department.AUTOMOBILE);
        create("it@example.com", "password123", Role.USER, Department.IT);

        create("seminaradmin@example.com", "admin123", Role.ADMIN_SEMINAR, null);
        create("resourceadmin@example.com", "admin123", Role.ADMIN_RESOURCE, null);
    }

    private void create(String email, String password, Role role, Department dept) {
        if (userRepo.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);
            user.setDepartment(dept);
            userRepo.save(user);
        }
    }
}