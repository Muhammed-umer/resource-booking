package com.resource.booking.Service;

import com.resource.booking.dto.AuthResponseDTO;
import com.resource.booking.dto.SignupRequestDTO;
import com.resource.booking.entity.*;
import com.resource.booking.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepo, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // --- 1. REGISTER USER (For Owner to create Accounts via Dashboard) ---
    public User registerUser(SignupRequestDTO dto) {
        if (userRepo.findByEmail(dto.email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(dto.email);
        user.setPassword(passwordEncoder.encode(dto.password));
        user.setName(dto.name);
        user.setRole(dto.role);

        // Logic: Map Checkbox Strings (DTO) -> Enum Set (Entity)
        if (dto.role == Role.ADMIN) {
            if (dto.managedFacilities != null && !dto.managedFacilities.isEmpty()) {
                Set<FacilityType> facilities = dto.managedFacilities.stream()
                        .map(FacilityType::valueOf) // Converts "SEMINAR_HALL" -> FacilityType.SEMINAR_HALL
                        .collect(Collectors.toSet());
                user.setManagedFacilities(facilities);
            } else {
                throw new RuntimeException("Admins must be assigned at least one facility.");
            }
        }
        else if (dto.role == Role.USER) {
            user.setDepartment(dto.department);
        }

        return userRepo.save(user);
    }

    // --- 2. CREATE INITIAL OWNER (Required by AuthController) ---
    public String createInitialOwner(String email, String password) {
        if (userRepo.count() > 0) {
            throw new RuntimeException("Owner already exists!");
        }
        User owner = new User();
        owner.setEmail(email);
        owner.setPassword(passwordEncoder.encode(password));
        owner.setRole(Role.OWNER);
        owner.setName("Super Owner");
        userRepo.save(owner);
        return "Owner Created Successfully";
    }

    // --- 3. GOOGLE LOGIN ---
    public AuthResponseDTO loginWithGoogle(String googleIdToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleIdToken;
        RestTemplate restTemplate = new RestTemplate();

        try {
            Map response = restTemplate.getForObject(url, Map.class);
            String email = (String) response.get("email");

            User user = userRepo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Account not found. Please contact the Owner."));

            String token = jwtService.generateToken(user);
            AuthResponseDTO dto = new AuthResponseDTO();
            dto.token = token;
            dto.role = user.getRole().name();
            return dto;

        } catch (Exception e) {
            throw new RuntimeException("Invalid Google Token");
        }
    }

    // --- 4. STANDARD LOGIN ---
    public AuthResponseDTO login(String email, String password){
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email"));

        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new RuntimeException("Invalid password");

        AuthResponseDTO response = new AuthResponseDTO();
        response.token = jwtService.generateToken(user);
        response.role = user.getRole().name();
        return response;
    }

    // --- 5. HELPERS ---
    public User findByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    // Legacy support for controllers calling findByUsername
    public User findByUsername(String email) {
        return findByEmail(email);
    }

    // Legacy simple create (optional)
    public User createUser(User newUser) {
        if (userRepo.findByEmail(newUser.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        return userRepo.save(newUser);
    }
}