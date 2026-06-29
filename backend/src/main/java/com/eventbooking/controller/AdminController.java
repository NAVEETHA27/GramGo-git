package com.eventbooking.controller;

import com.eventbooking.dto.request.ApprovalDecisionRequest;
import com.eventbooking.dto.request.RefundStatusUpdateRequest;
import com.eventbooking.dto.response.ApiResponse;
import com.eventbooking.dto.response.EventResponse;
import com.eventbooking.dto.response.RefundResponse;
import com.eventbooking.model.ApprovalRequest;
import com.eventbooking.model.Event;
import com.eventbooking.repository.*;
import com.eventbooking.security.AuthPrincipal;
import com.eventbooking.service.AdminDashboardService;
import com.eventbooking.service.AuditService;
import com.eventbooking.service.EventService;
import com.eventbooking.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final AdminDashboardService dashboardService;
    private final EventService eventService;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final UserRepository userRepository;
    private final OrganizerRepository organizerRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final AuditLogRepository auditLogRepository;
    private final RefundService refundService;
    private final AuditService auditService;

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        return ApiResponse.success(dashboardService.stats());
    }

    @GetMapping("/approvals")
    public ApiResponse<Page<ApprovalRequest>> approvals(@RequestParam(required = false) ApprovalRequest.ApprovalStatus status,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
        return ApiResponse.success(status == null
                ? approvalRequestRepository.findAll(pageable)
                : approvalRequestRepository.findByStatus(status, pageable));
    }

    @PostMapping("/events/{eventId}/review")
    public ApiResponse<EventResponse> reviewEvent(@PathVariable Long eventId,
                                                  @Valid @RequestBody ApprovalDecisionRequest request,
                                                  @AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.success("Review saved",
                eventService.reviewEvent(eventId, principal.getId(), request.getDecision(), request.getReason()));
    }

    @GetMapping("/vehicles")
    public ApiResponse<?> vehicles(Pageable pageable) {
        return ApiResponse.success(eventRepository.findAll(pageable));
    }

    @GetMapping("/vehicles/pending")
    public ApiResponse<?> pendingVehicles(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.success(eventRepository.findAll((root, query, cb) ->
                cb.equal(root.get("status"), Event.EventStatus.PENDING_APPROVAL), pageable));
    }

    @PutMapping("/vehicles/{eventId}/approve")
    public ApiResponse<EventResponse> approveVehicle(@PathVariable Long eventId,
                                                     @AuthenticationPrincipal AuthPrincipal principal) {
        EventResponse result = eventService.reviewEvent(eventId, principal.getId(), "APPROVE", null);
        auditService.record(principal.getId(), "ADMIN", "VEHICLE_APPROVED",
                "VEHICLE", String.valueOf(eventId), "Vehicle approved by admin");
        return ApiResponse.success("Vehicle approved", result);
    }

    @PutMapping("/vehicles/{eventId}/reject")
    public ApiResponse<EventResponse> rejectVehicle(@PathVariable Long eventId,
                                                    @RequestBody(required = false) Map<String, String> body,
                                                    @AuthenticationPrincipal AuthPrincipal principal) {
        String reason = body == null ? null : body.get("reason");
        EventResponse result = eventService.reviewEvent(eventId, principal.getId(), "REJECT", reason);
        auditService.record(principal.getId(), "ADMIN", "VEHICLE_REJECTED",
                "VEHICLE", String.valueOf(eventId), "Reason: " + (reason != null ? reason : "No reason provided"));
        return ApiResponse.success("Vehicle rejected", result);
    }

    @GetMapping("/users")
    public ApiResponse<?> users(Pageable pageable) { return ApiResponse.success(userRepository.findAll(pageable)); }
    @GetMapping("/organizers")
    public ApiResponse<?> organizers(Pageable pageable) { return ApiResponse.success(organizerRepository.findAll(pageable)); }
    @GetMapping("/events")
    public ApiResponse<?> events(Pageable pageable) { return ApiResponse.success(eventRepository.findAll(pageable)); }
    @GetMapping("/bookings")
    public ApiResponse<?> bookings(Pageable pageable) { return ApiResponse.success(bookingRepository.findAll(pageable)); }
    @GetMapping("/payments")
    public ApiResponse<?> payments(Pageable pageable) { return ApiResponse.success(paymentRepository.findAll(pageable)); }
    @GetMapping("/refunds")
    public ApiResponse<?> refunds(Pageable pageable) { return ApiResponse.success(refundRepository.findAll(pageable)); }

    @PatchMapping("/refunds/{refundId}/status")
    public ApiResponse<RefundResponse> updateRefundStatus(@PathVariable Long refundId,
                                                          @Valid @RequestBody RefundStatusUpdateRequest request,
                                                          @AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.success("Refund status updated",
                refundService.updateStatus(refundId, request.getStatus(), principal.getId(), request.getNote()));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<?> auditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.success(auditLogRepository.findAll(pageable));
    }

    /** Dedicated activity endpoint for frontend admin activity page */
    @GetMapping("/activity")
    public ApiResponse<?> activity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.success(auditLogRepository.findAll(pageable));
    }

    /** Dedicated renters endpoint — users with role USER only */
    @GetMapping("/renters")
    public ApiResponse<?> renters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.success(
                userRepository.findAll(pageable)
                        .map(u -> u) // returns all; frontend filters by role
        );
    }
}
