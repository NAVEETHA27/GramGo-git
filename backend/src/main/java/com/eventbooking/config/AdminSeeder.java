package com.eventbooking.config;

import com.eventbooking.model.User;
import com.eventbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the default ADMIN account on application startup if it does not exist.
 *
 * Credentials are driven by environment variables (never hardcoded):
 *   ADMIN_EMAIL    (default: admin@gramgo.com)
 *   ADMIN_PASSWORD (default: Admin@GramGo1 — change in production!)
 *   ADMIN_NAME     (default: Platform Admin)
 *
 * Only ONE admin is created. If the email already exists as any role, seeding is skipped.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;

    @Value("${admin.email:admin@gramgo.com}")
    private String adminEmail;

    @Value("${admin.password:Admin@GramGo1}")
    private String adminPassword;

    @Value("${admin.name:Platform Admin}")
    private String adminName;

    @Override
    public void run(String... args) {
        String email = adminEmail.trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            log.info("[AdminSeeder] Admin account already exists for {}. Skipping.", email);
            return;
        }

        User admin = User.builder()
                .name(adminName)
                .email(email)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(User.UserRole.ADMIN)
                .emailVerified(true)
                .accountLocked(false)
                .build();

        admin = userRepository.saveAndFlush(admin);
        admin.setUserCode("ADMIN" + String.format("%03d", admin.getId()));
        userRepository.save(admin);

        log.info("[AdminSeeder] ✅ Admin account created: {} (id={})", email, admin.getId());
        log.warn("[AdminSeeder] ⚠️  Using default admin password — set ADMIN_PASSWORD env var in production!");
    }
}
