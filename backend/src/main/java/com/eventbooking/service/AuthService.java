package com.eventbooking.service;

import com.eventbooking.dto.request.*;
import com.eventbooking.dto.response.AuthResponse;
import com.eventbooking.exception.*;
import com.eventbooking.model.Organizer;
import com.eventbooking.model.ProfileLocation;
import com.eventbooking.model.User;
import com.eventbooking.model.mongo.PendingRegistration;
import com.eventbooking.repository.OrganizerRepository;
import com.eventbooking.repository.ProfileLocationRepository;
import com.eventbooking.repository.UserRepository;
import com.eventbooking.repository.mongo.PendingRegistrationRepository;
import com.eventbooking.security.JwtTokenProvider;
import com.eventbooking.security.OtpStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizerRepository organizerRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final ProfileLocationRepository profileLocationRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final OtpStore otpStore;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public AuthResponse registerUser(UserRegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String name = StringUtils.trimWhitespace(request.getName());
        request.setEmail(email);
        request.setName(name);

        if (userRepository.existsByEmail(email) || organizerRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account already exists with email: " + email);
        }

        pendingRegistrationRepository.deleteByEmailAndRole(email, "USER");
        pendingRegistrationRepository.save(PendingRegistration.builder()
                .email(email)
                .role("USER")
                .userRequest(request)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build());

        String otp = otpStore.generate(email);
        boolean emailSent = sendRegistrationOtp(email, name, otp);
        log.info("Pending user registration staged for {}", email);

        return pendingAuthResponse(email, "USER", name, emailSent ? null : otp);
    }

    @Transactional
    public AuthResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid Credentials"));

        if (user.isAccountLocked()) {
            throw new AccountLockedException("Account is locked. Please contact support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            userRepository.incrementFailedAttempts(user.getId());
            if (user.getFailedLoginAttempts() + 1 >= 5) {
                user.setAccountLocked(true);
                userRepository.save(user);
                throw new AccountLockedException("Account locked after too many failed attempts.");
            }
            throw new InvalidCredentialsException("Invalid Credentials");
        }

        if (!user.isEmailVerified()) {
            throw new UnauthorizedException("Please verify your email before logging in.");
        }

        userRepository.resetFailedAttempts(user.getId());
        notificationService.sendNotification(user.getId(), "USER",
                "LOGIN_ALERT", "New Login Detected",
                "A new login was detected on your account.", null);
        auditService.record(user.getId(), "USER", "LOGIN", "USER",
                String.valueOf(user.getId()), "User login");

        return buildAuthResponse(user.getId(), user.getEmail(), user.getRole().name(),
                user.getName(), user.getProfilePicture(), user.isEmailVerified());
    }

    @Transactional
    public AuthResponse loginAdmin(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        // Find user by email first — throw generic error so we don't reveal
        // whether the account exists or not (security best practice)
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // Verify this account actually has ADMIN role
        if (admin.getRole() != User.UserRole.ADMIN) {
            log.warn("[Admin Login] Non-admin account tried to use admin login: {}", email);
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (admin.isAccountLocked()) {
            throw new AccountLockedException("This account is locked. Please contact support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            // Increment failed attempts
            userRepository.incrementFailedAttempts(admin.getId());
            long attempts = admin.getFailedLoginAttempts() + 1;
            if (attempts >= 5) {
                admin.setAccountLocked(true);
                userRepository.save(admin);
                throw new AccountLockedException("Account locked after too many failed attempts.");
            }
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Successful login — reset failed attempts and write audit log
        userRepository.resetFailedAttempts(admin.getId());
        auditService.record(admin.getId(), "ADMIN", "ADMIN_LOGIN", "ADMIN",
                String.valueOf(admin.getId()), "Admin login successful");

        log.info("[Admin Login] ✅ Admin authenticated: {}", email);

        return buildAuthResponse(admin.getId(), admin.getEmail(), admin.getRole().name(),
                admin.getName(), admin.getProfilePicture(), admin.isEmailVerified());
    }

    @Transactional
    public AuthResponse registerOrganizer(OrganizerRegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        request.setEmail(email);

        if (organizerRepository.existsByEmail(email) || userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account already exists with email: " + email);
        }

        pendingRegistrationRepository.deleteByEmailAndRole(email, "ORGANIZER");
        pendingRegistrationRepository.save(PendingRegistration.builder()
                .email(email)
                .role("ORGANIZER")
                .organizerRequest(request)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build());

        String otp = otpStore.generate(email);
        boolean emailSent = sendRegistrationOtp(email, request.getOrganizerName(), otp);
        log.info("Pending organizer registration staged for {}", email);

        return pendingAuthResponse(email, "ORGANIZER", request.getOrganizerName(), emailSent ? null : otp);
    }

    @Transactional
    public AuthResponse loginOrganizer(LoginRequest request) {
        Organizer organizer = organizerRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid Credentials"));

        if (!passwordEncoder.matches(request.getPassword(), organizer.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid Credentials");
        }
        if (!organizer.isEmailVerified()) {
            throw new UnauthorizedException("Please verify your email before logging in.");
        }

        auditService.record(organizer.getId(), "ORGANIZER", "LOGIN", "ORGANIZER",
                String.valueOf(organizer.getId()), "Organizer login");

        return buildAuthResponse(organizer.getId(), organizer.getEmail(),
                organizer.getRole().name(), organizer.getOrganizerName(),
                organizer.getOrganizationLogo(), organizer.isEmailVerified());
    }

    @Transactional
    public void markEmailVerifiedByOtp(String email, String role) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedRole = "ORGANIZER".equalsIgnoreCase(role) ? "ORGANIZER" : "USER";

        pendingRegistrationRepository.findByEmailAndRole(normalizedEmail, normalizedRole)
                .ifPresent(pending -> {
                    if (pending.getExpiresAt() != null && pending.getExpiresAt().isBefore(Instant.now())) {
                        pendingRegistrationRepository.delete(pending);
                        throw new TokenExpiredException("Registration OTP has expired. Please register again.");
                    }
                    if ("ORGANIZER".equals(normalizedRole)) {
                        createOrganizerFromPending(pending.getOrganizerRequest());
                    } else {
                        createUserFromPending(pending.getUserRequest());
                    }
                    pendingRegistrationRepository.delete(pending);
                });

        if ("ORGANIZER".equals(normalizedRole)) {
            Organizer org = organizerRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));
            org.setEmailVerified(true);
            org.setVerificationToken(null);
            organizerRepository.save(org);
        } else {
            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
        }
    }

    @Transactional
    public void verifyEmail(String token, String role) {
        if ("USER".equalsIgnoreCase(role)) {
            User user = userRepository.findByVerificationToken(token)
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired verification token"));
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
        } else {
            Organizer org = organizerRepository.findByVerificationToken(token)
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired verification token"));
            org.setEmailVerified(true);
            org.setVerificationToken(null);
            organizerRepository.save(org);
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(1);

        if ("USER".equalsIgnoreCase(request.getRole())) {
            User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                    .orElseThrow(() -> new ResourceNotFoundException("No account found with that email"));
            user.setResetPasswordToken(resetToken);
            user.setResetTokenExpiry(expiry);
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
        } else {
            Organizer org = organizerRepository.findByEmail(normalizeEmail(request.getEmail()))
                    .orElseThrow(() -> new ResourceNotFoundException("No account found with that email"));
            org.setResetPasswordToken(resetToken);
            org.setResetTokenExpiry(expiry);
            organizerRepository.save(org);
            emailService.sendPasswordResetEmail(org.getEmail(), org.getOrganizerName(), resetToken);
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if ("USER".equalsIgnoreCase(request.getRole())) {
            User user = userRepository.findByResetPasswordToken(request.getToken())
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired reset token"));
            if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                throw new TokenExpiredException("Password reset token has expired");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            user.setResetPasswordToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
        } else {
            Organizer org = organizerRepository.findByResetPasswordToken(request.getToken())
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired reset token"));
            if (org.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                throw new TokenExpiredException("Password reset token has expired");
            }
            org.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            org.setResetPasswordToken(null);
            org.setResetTokenExpiry(null);
            organizerRepository.save(org);
        }
    }

    @Transactional
    public void resetPasswordWithOtp(String email, String role, String otp, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        if (!otpStore.verify(normalizedEmail, otp)) {
            throw new InvalidCredentialsException("Invalid or expired OTP. Please request a new one.");
        }

        if ("USER".equalsIgnoreCase(role)) {
            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("No account found with that email"));
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setResetPasswordToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
        } else {
            Organizer org = organizerRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("No account found with that email"));
            org.setPasswordHash(passwordEncoder.encode(newPassword));
            org.setResetPasswordToken(null);
            org.setResetTokenExpiry(null);
            organizerRepository.save(org);
        }
    }

    private AuthResponse buildAuthResponse(Long id, String email, String role,
                                            String name, String picture, boolean verified) {
        String accessToken = jwtTokenProvider.generateToken(id, email, role);
        String refreshToken = jwtTokenProvider.generateRefreshToken(id, email, role);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(AuthResponse.UserInfo.builder()
                        .id(id)
                        .name(name)
                        .email(email)
                        .role(role)
                        .profilePicture(picture)
                        .emailVerified(verified)
                        .build())
                .build();
    }

    private AuthResponse pendingAuthResponse(String email, String role, String name, String devOtp) {
        return AuthResponse.builder()
                .tokenType("Pending")
                .expiresIn(300_000)
                .devOtp(devOtp)
                .user(AuthResponse.UserInfo.builder()
                        .name(name)
                        .email(email)
                        .role(role)
                        .emailVerified(false)
                        .build())
                .build();
    }

    private boolean sendRegistrationOtp(String email, String name, String otp) {
        try {
            emailService.sendOtpEmail(email, name, otp);
            return true;
        } catch (RuntimeException ex) {
            log.warn("OTP email delivery failed for {}. Keeping registration pending and returning dev OTP. Cause: {}",
                    email, ex.getMessage());
            return false;
        }
    }

    private User createUserFromPending(UserRegisterRequest request) {
        if (request == null) {
            throw new ResourceNotFoundException("Pending user registration not found");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User Already Exists with email: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .pinCode(request.getPinCode())
                .organizationName(request.getOrganizationName())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .emailVerified(true)
                .verificationToken(null)
                .role(User.UserRole.USER)
                .build();

        user = userRepository.saveAndFlush(user);
        user.setUserCode("U" + String.format("%06d", user.getId()));
        user = userRepository.save(user);
        saveInitialUserLocation(user.getId(), request);

        notificationService.sendNotification(user.getId(), "USER",
                "REGISTRATION_SUCCESS", "Welcome to GramGo!",
                "Your verified account has been created.", null);
        auditService.record(user.getId(), "USER", "REGISTRATION", "USER",
                String.valueOf(user.getId()), "User registered after OTP verification");
        return user;
    }

    private Organizer createOrganizerFromPending(OrganizerRegisterRequest request) {
        if (request == null) {
            throw new ResourceNotFoundException("Pending organizer registration not found");
        }
        if (organizerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Organizer Already Exists with email: " + request.getEmail());
        }

        Organizer organizer = Organizer.builder()
                .organizerName(request.getOrganizerName())
                .organizationName(request.getOrganizationName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .pinCode(request.getPinCode())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .website(request.getWebsite())
                .description(request.getDescription())
                .emailVerified(true)
                .verificationToken(null)
                .role(Organizer.OrganizerRole.ORGANIZER)
                .build();

        organizer = organizerRepository.saveAndFlush(organizer);
        organizer.setOrganizerCode(buildOrganizerCode(organizer.getOrganizationName(), organizer.getId()));
        organizer = organizerRepository.save(organizer);

        notificationService.sendNotification(organizer.getId(), "ORGANIZER",
                "REGISTRATION_SUCCESS", "Welcome Organizer!",
                "Your verified organizer account has been created.", null);
        auditService.record(organizer.getId(), "ORGANIZER", "REGISTRATION", "ORGANIZER",
                String.valueOf(organizer.getId()), "Organizer registered after OTP verification");
        return organizer;
    }

    private String buildOrganizerCode(String organizationName, Long id) {
        String cleaned = organizationName == null ? "ORG" : organizationName.replaceAll("[^A-Za-z]", "").toUpperCase();
        String prefix = (cleaned + "ORG").substring(0, 3);
        return "O" + prefix + String.format("%06d", id);
    }

    private String normalizeEmail(String email) {
        String normalized = StringUtils.trimWhitespace(email);
        return normalized == null ? null : normalized.toLowerCase();
    }

    private void saveInitialUserLocation(Long userId, UserRegisterRequest request) {
        boolean hasLocation =
                StringUtils.hasText(request.getAddress()) ||
                StringUtils.hasText(request.getStreet()) ||
                StringUtils.hasText(request.getArea()) ||
                StringUtils.hasText(request.getCity()) ||
                StringUtils.hasText(request.getDistrict()) ||
                StringUtils.hasText(request.getState()) ||
                StringUtils.hasText(request.getCountry()) ||
                StringUtils.hasText(request.getPinCode()) ||
                request.getLatitude() != null ||
                request.getLongitude() != null;

        if (!hasLocation) return;

        ProfileLocation location = ProfileLocation.builder()
                .userId(userId)
                .address(request.getAddress())
                .street(request.getStreet())
                .area(request.getArea())
                .city(request.getCity())
                .district(request.getDistrict())
                .state(request.getState())
                .country(request.getCountry())
                .pinCode(request.getPinCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
        profileLocationRepository.save(location);
    }
}

