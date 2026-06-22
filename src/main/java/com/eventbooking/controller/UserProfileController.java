package com.eventbooking.controller;

import com.eventbooking.dto.response.ApiResponse;
import com.eventbooking.dto.request.ProfileLocationRequest;
import com.eventbooking.dto.response.ProfileLocationResponse;
import com.eventbooking.dto.response.UserProfileResponse;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.model.User;
import com.eventbooking.repository.UserRepository;
import com.eventbooking.security.AuthPrincipal;
import com.eventbooking.service.AuditService;
import com.eventbooking.service.ProfileLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class UserProfileController {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final ProfileLocationService profileLocationService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal AuthPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(UserProfileResponse.from(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (body.containsKey("name") && StringUtils.hasText(body.get("name")))
            user.setName(StringUtils.trimWhitespace(body.get("name")));
        if (body.containsKey("phone"))
            user.setPhone(StringUtils.trimWhitespace(body.get("phone")));
        if (body.containsKey("address"))
            user.setAddress(StringUtils.trimWhitespace(body.get("address")));
        if (body.containsKey("pinCode"))
            user.setPinCode(StringUtils.trimWhitespace(body.get("pinCode")));
        if (body.containsKey("organizationName"))
            user.setOrganizationName(StringUtils.trimWhitespace(body.get("organizationName")));
        if (body.containsKey("city"))
            user.setCity(StringUtils.trimWhitespace(body.get("city")));
        if (body.containsKey("state"))
            user.setState(StringUtils.trimWhitespace(body.get("state")));
        if (body.containsKey("country"))
            user.setCountry(StringUtils.trimWhitespace(body.get("country")));
        if (body.containsKey("gender"))
            user.setGender(body.get("gender"));

        userRepository.save(user);
        auditService.record(principal.getId(), "USER", "ACCOUNT_UPDATED", "USER",
                String.valueOf(user.getId()), "User profile updated");
        return ResponseEntity.ok(ApiResponse.success("Profile updated", UserProfileResponse.from(user)));
    }

    @GetMapping("/profile/location")
    public ResponseEntity<ApiResponse<ProfileLocationResponse>> getLocation(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(profileLocationService.get(principal.getId(), "USER")));
    }

    @PutMapping("/profile/location")
    public ResponseEntity<ApiResponse<ProfileLocationResponse>> updateLocation(
            @Valid @RequestBody ProfileLocationRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Location updated",
                profileLocationService.save(principal.getId(), "USER", request)));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<ApiResponse<String>> uploadPicture(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthPrincipal principal) throws IOException {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String ext      = getExtension(file.getOriginalFilename());
        String filename = "user_" + principal.getId() + "_" + UUID.randomUUID() + ext;
        Path   dir      = Paths.get("uploads/profile");
        Files.createDirectories(dir);
        Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        user.setProfilePicture("/uploads/profile/" + filename);
        userRepository.save(user);
        auditService.record(principal.getId(), "USER", "PROFILE_PHOTO_UPDATED", "USER",
                String.valueOf(user.getId()), "Profile photo updated");
        return ResponseEntity.ok(ApiResponse.success("Profile picture updated", user.getProfilePicture()));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(body.get("currentPassword"), user.getPasswordHash()))
            return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));

        String newPassword = body.get("newPassword");
        if (!StringUtils.hasText(newPassword) || newPassword.length() < 8)
            return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 8 characters"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.record(principal.getId(), "USER", "PASSWORD_CHANGED", "USER",
                String.valueOf(user.getId()), "Password changed");
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
