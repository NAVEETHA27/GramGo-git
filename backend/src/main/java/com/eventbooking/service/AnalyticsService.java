package com.eventbooking.service;

import com.eventbooking.model.mongo.AnalyticsData;
import com.eventbooking.repository.BookingRepository;
import com.eventbooking.repository.PaymentRepository;
import com.eventbooking.repository.EventRepository;
import com.eventbooking.repository.mongo.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final BookingRepository   bookingRepository;
    private final PaymentRepository   paymentRepository;
    private final EventRepository     eventRepository;

    public Map<String, Object> getOrganizerDashboard(Long organizerId) {
        Map<String, Object> dashboard = new HashMap<>();

        // Total events
        long totalEvents = eventRepository.findByOrganizerId(organizerId,
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        dashboard.put("totalEvents", totalEvents);

        // Total revenue
        BigDecimal revenue = paymentRepository.sumRevenueByOrganizer(organizerId);
        dashboard.put("totalRevenue", revenue != null ? revenue : BigDecimal.ZERO);

        // Analytics data last 30 days
        LocalDate from = LocalDate.now().minusDays(30);
        List<AnalyticsData> analyticsData = analyticsRepository
                .findByOrganizerIdAndDateBetween(organizerId, from, LocalDate.now());
        dashboard.put("analyticsLast30Days", analyticsData);

        return dashboard;
    }

    public Map<String, Object> getUserDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();
        long totalBookings = bookingRepository.findByUserId(userId,
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        dashboard.put("totalBookings", totalBookings);
        return dashboard;
    }

    public void recordDailySnapshot(Long organizerId, Long eventId,
                                     int bookings, int tickets, BigDecimal revenue, int cancellations) {
        LocalDate today = LocalDate.now();
        AnalyticsData existing = analyticsRepository.findByEventIdAndDate(eventId, today).orElse(null);
        if (existing != null) {
            existing.setTotalBookings(existing.getTotalBookings() + bookings);
            existing.setTotalTicketsSold(existing.getTotalTicketsSold() + tickets);
            existing.setTotalRevenue(existing.getTotalRevenue().add(revenue));
            existing.setTotalCancellations(existing.getTotalCancellations() + cancellations);
            existing.setUpdatedAt(LocalDateTime.now());
            analyticsRepository.save(existing);
        } else {
            analyticsRepository.save(AnalyticsData.builder()
                    .organizerId(organizerId)
                    .eventId(eventId)
                    .date(today)
                    .totalBookings(bookings)
                    .totalTicketsSold(tickets)
                    .totalRevenue(revenue)
                    .totalCancellations(cancellations)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        }
    }
}
