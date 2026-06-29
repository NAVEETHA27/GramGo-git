package com.eventbooking.controller;

import com.eventbooking.dto.request.ApprovalDecisionRequest;
import com.eventbooking.dto.request.RefundStatusUpdateRequest;
import com.eventbooking.dto.response.ApiResponse;
import com.eventbooking.dto.response.EventResponse;
import com.eventbooking.dto.response.RefundResponse;
import com.eventbooking.model.ApprovalRequest;
import com.eventbooking.repository.*;
import com.eventbooking.security.AuthPrincipal;
import com.eventbooking.service.AdminDashboardService;
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
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final AuditLogRepository auditLogRepository;
    private final RefundService refundService;

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

    @GetMapping("/users")
    public ApiResponse<?> users(Pageable pageable) { return ApiResponse.success(userRepository.findAll(pageable)); }
    @GetMapping("/organizers")
    public ApiResponse<?> organizers(Pageable pageable) { return ApiResponse.success(organizerRepository.findAll(pageable)); }
    @GetMapping("/events")
    public ApiResponse<?> events(Pageable pageable) { return ApiResponse.success(eventRepository.findAll(pageable)); }
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
    public ApiResponse<?> auditLogs(Pageable pageable) {
        return ApiResponse.success(auditLogRepository.findAll(pageable));
    }
}
