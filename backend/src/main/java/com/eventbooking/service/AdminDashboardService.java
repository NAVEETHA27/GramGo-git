package com.eventbooking.service;

import com.eventbooking.model.Booking;
import com.eventbooking.model.Event;
import com.eventbooking.model.Payment;
import com.eventbooking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository         userRepository;
    private final OrganizerRepository    organizerRepository;
    private final EventRepository        eventRepository;
    private final PaymentRepository      paymentRepository;
    private final RefundRepository       refundRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final BookingRepository      bookingRepository;

    public Map<String, Object> stats() {

        BigDecimal revenue = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.SUCCESSFUL)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // vehicle listing counts
        long totalVehicles     = eventRepository.count();
        long pendingApprovals  = approvalRequestRepository
                .findByStatus(com.eventbooking.model.ApprovalRequest.ApprovalStatus.PENDING,
                        PageRequest.of(0, 1)).getTotalElements();
        long approvedVehicles  = eventRepository.findByStatus(Event.EventStatus.APPROVED).size()
                               + eventRepository.findByStatus(Event.EventStatus.PUBLISHED).size();
        long rejectedVehicles  = eventRepository.findByStatus(Event.EventStatus.REJECTED).size();
        long activeListings    = eventRepository.findByStatus(Event.EventStatus.PUBLISHED).size();
        long cancelledListings = eventRepository.findByStatus(Event.EventStatus.CANCELLED).size();

        // booking counts
        long activeBookings    = bookingRepository
                .findAll().stream()
                .filter(b -> b.getBookingStatus() == Booking.BookingStatus.CONFIRMED)
                .count();
        long completedBookings = bookingRepository
                .findAll().stream()
                .filter(b -> b.getBookingStatus() == Booking.BookingStatus.EXPIRED)
                .count();
        long cancelledBookings = bookingRepository
                .findAll().stream()
                .filter(b -> b.getBookingStatus() == Booking.BookingStatus.CANCELLED)
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers",        userRepository.count());
        result.put("totalOrganizers",   organizerRepository.count());
        result.put("totalVehicles",     totalVehicles);
        result.put("pendingApprovals",  pendingApprovals);
        result.put("approvedVehicles",  approvedVehicles);
        result.put("rejectedVehicles",  rejectedVehicles);
        result.put("activeListings",    activeListings);
        result.put("cancelledListings", cancelledListings);
        result.put("activeBookings",    activeBookings);
        result.put("completedBookings", completedBookings);
        result.put("cancelledBookings", cancelledBookings);
        result.put("totalRevenue",      revenue);
        result.put("refundRequests",    refundRepository.count());
        return result;
    }
}
