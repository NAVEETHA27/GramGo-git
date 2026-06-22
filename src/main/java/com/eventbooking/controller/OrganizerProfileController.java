package com.eventbooking.controller;

import com.eventbooking.dto.response.ApiResponse;
import com.eventbooking.dto.request.ProfileLocationRequest;
import com.eventbooking.dto.response.OrganizerProfileResponse;
import com.eventbooking.dto.response.ProfileLocationResponse;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.model.Organizer;
import com.eventbooking.repository.OrganizerRepository;
import com.eventbooking.security.AuthPrincipal;
import com.eventbooking.service.AnalyticsService;
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
@RequestMapping("/organizer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ORGANIZER')")
public class OrganizerProfileController {

    private final OrganizerRepository organizerRepository;
    private final PasswordEncoder     passwordEncoder;
    private final AnalyticsService    analyticsService;
    private final AuditService auditService;
    private final ProfileLocationService profileLocationService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<OrganizerProfileResponse>> getProfile(
            @AuthenticationPrincipal AuthPrincipal principal) {
        Organizer org = organizerRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));
        return ResponseEntity.ok(ApiResponse.success(OrganizerProfileResponse.from(org)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<OrganizerProfileResponse>> updateProfile(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthPrincipal principal) {
        Organizer org = organizerRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        if (body.containsKey("organizerName") && StringUtils.hasText(body.get("organizerName")))
            org.setOrganizerName(StringUtils.trimWhitespace(body.get("organizerName")));
        if (body.containsKey("organizationName") && StringUtils.hasText(body.get("organizationName")))
            org.setOrganizationName(StringUtils.trimWhitespace(body.get("organizationName")));
        if (body.containsKey("phone"))
            org.setPhone(StringUtils.trimWhitespace(body.get("phone")));
        if (body.containsKey("address"))
            org.setAddress(StringUtils.trimWhitespace(body.get("address")));
        if (body.containsKey("pinCode"))
            org.setPinCode(StringUtils.trimWhitespace(body.get("pinCode")));
        if (body.containsKey("city"))
            org.setCity(StringUtils.trimWhitespace(body.get("city")));
        if (body.containsKey("state"))
            org.setState(StringUtils.trimWhitespace(body.get("state")));
        if (body.containsKey("country"))
            org.setCountry(StringUtils.trimWhitespace(body.get("country")));
        if (body.containsKey("website"))
            org.setWebsite(StringUtils.trimWhitespace(body.get("website")));
        if (body.containsKey("description"))
            org.setDescription(StringUtils.trimWhitespace(body.get("description")));

        organizerRepository.save(org);
        auditService.record(principal.getId(), "ORGANIZER", "ACCOUNT_UPDATED", "ORGANIZER",
                String.valueOf(org.getId()), "Organizer profile updated");
        return ResponseEntity.ok(ApiResponse.success("Profile updated", OrganizerProfileResponse.from(org)));
    }

    @GetMapping("/profile/location")
    public ResponseEntity<ApiResponse<ProfileLocationResponse>> getLocation(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(profileLocationService.get(principal.getId(), "ORGANIZER")));
    }

    @PutMapping("/profile/location")
    public ResponseEntity<ApiResponse<ProfileLocationResponse>> updateLocation(
            @Valid @RequestBody ProfileLocationRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Location updated",
                profileLocationService.save(principal.getId(), "ORGANIZER", request)));
    }

    @PostMapping("/profile/logo")
    public ResponseEntity<ApiResponse<String>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthPrincipal principal) throws IOException {
        Organizer org = organizerRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        String ext      = getExtension(file.getOriginalFilename());
        String filename = "org_" + principal.getId() + "_" + UUID.randomUUID() + ext;
        Path   dir      = Paths.get("uploads/logos");
        Files.createDirectories(dir);
        Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        org.setOrganizationLogo("/uploads/logos/" + filename);
        organizerRepository.save(org);
        auditService.record(principal.getId(), "ORGANIZER", "ORGANIZATION_LOGO_UPDATED", "ORGANIZER",
                String.valueOf(org.getId()), "Organization logo updated");
        return ResponseEntity.ok(ApiResponse.success("Logo updated", org.getOrganizationLogo()));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthPrincipal principal) {
        Organizer org = organizerRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        if (!passwordEncoder.matches(body.get("currentPassword"), org.getPasswordHash()))
            return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));

        String newPassword = body.get("newPassword");
        if (!StringUtils.hasText(newPassword) || newPassword.length() < 8)
            return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 8 characters"));

        org.setPasswordHash(passwordEncoder.encode(newPassword));
        organizerRepository.save(org);
        auditService.record(principal.getId(), "ORGANIZER", "PASSWORD_CHANGED", "ORGANIZER",
                String.valueOf(org.getId()), "Password changed");
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getOrganizerDashboard(principal.getId())));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
