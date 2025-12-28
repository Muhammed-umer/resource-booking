package com.resource.booking.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Set;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    private Department department; // for USER only

    private String name; // for ADMIN/OWNER

    // Stores permissions (e.g., [AUDITORIUM, GUEST_HOUSE])
    @ElementCollection(targetClass = FacilityType.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_managed_facilities", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    private Set<FacilityType> managedFacilities;

    // REMOVED: private String managedResource; (Redundant and error-prone)

    // Getters and Setters are handled by @Data (Lombok) but explicit ones are fine too.
}