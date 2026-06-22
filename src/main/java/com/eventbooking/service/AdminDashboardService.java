package com.eventbooking.service;

import com.eventbooking.model.Event;
import com.eventbooking.model.Payment;
import com.eventbooking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private final UserRepository userRepository;
    private final OrganizerRepository organizerRepository;
    private final EventRepository eventRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final ApprovalRequestRepository approvalRequestRepository;

    public Map<String, Object> stats() {
        BigDecimal revenue = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.SUCCESSFUL)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "totalUsers", userRepository.count(),
                "totalOrganizers", organizerRepository.count(),
                "totalEvents", eventRepository.count(),
                "pendingApprovals", approvalRequestRepository.findByStatus(com.eventbooking.model.ApprovalRequest.ApprovalStatus.PENDING, PageRequest.of(0, 1)).getTotalElements(),
                "totalRevenue", revenue,
                "refundRequests", refundRepository.count(),
                "activeEvents", eventRepository.findByStatus(Event.EventStatus.PUBLISHED).size(),
                "cancelledEvents", eventRepository.findByStatus(Event.EventStatus.CANCELLED).size()
        );
    }
}
