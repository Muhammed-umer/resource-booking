package com.resource.booking.Service;
import com.resource.booking.dto.LoginRequestDTO;
import com.resource.booking.dto.SignupRequestDTO;
import com.resource.booking.dto.AuthResponseDTO;
import com.resource.booking.dto.ForgetPasswordRequestDTO;
import com.resource.booking.dto.ResetPasswordRequestDTO;
import com.resource.booking.entity.PasswordResetToken;
import com.resource.booking.entity.Role;
import com.resource.booking.entity.User;
import com.resource.booking.repository.PasswordResetTokenRepository;
import com.resource.booking.repository.UserRepository;
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

    public String signup(SignupRequestDTO dto) {

        if (userRepo.findByEmail(dto.email).isPresent())
            throw new RuntimeException("Email already exists");

        User user = new User();
        user.setEmail(dto.email);
        user.setPassword(passwordEncoder.encode(dto.password));
        user.setRole(dto.role);

        // ===== ROLE BASED LOGIC =====
        if (dto.role == Role.USER) {

            if (dto.department == null)
                throw new RuntimeException("Department is required for USER");

            user.setDepartment(dto.department);
            user.setName(null); // USER-ku name theva illa
        }
        else if (dto.role == Role.ADMIN_SEMINAR || dto.role == Role.ADMIN_RESOURCE) {

            user.setDepartment(null); // ADMIN-ku department vendam
            user.setName(dto.name);   // optional admin name
        }
        else {
            throw new RuntimeException("Invalid role");
        }

        userRepo.save(user);
        return "User registered successfully";
    }


    public AuthResponseDTO login(LoginRequestDTO dto){
        User user = userRepo.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid password");

        String token = jwtService.generateToken(user);

        AuthResponseDTO response = new AuthResponseDTO();
        response.token = token;
        response.role = user.getRole().name();

        return response;
    }

    public void forgotPassword(String email) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 🔥 DELETE existing token (VERY IMPORTANT)
        passwordResetTokenRepository.findByUser(user)
                .ifPresent(passwordResetTokenRepository::delete);

        // generate new token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(
                new Date(System.currentTimeMillis() + 3600000) // 1 hour
        );

        passwordResetTokenRepository.save(resetToken);

        String resetLink = "http://localhost:8082/reset-password?token=" + token;

        emailService.sendEmail(
                user.getEmail(),
                "Reset Password",
                "Click here to reset password: " + resetLink
        );

    }

    // ----------------- RESET PASSWORD -----------------
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

        // optional: delete token after use
        passwordResetTokenRepository.delete(resetToken);}

}


