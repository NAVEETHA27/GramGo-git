package com.eventbooking.dto.response;

import com.eventbooking.model.Booking;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingResponse {
    private Long id;
    private String ticketId;
    private int quantity;
    private BigDecimal totalAmount;
    private Booking.BookingStatus bookingStatus;
    private String qrCodePath;
    private LocalDateTime bookedAt;
    private EventInfo event;
    private UserInfo user;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EventInfo {
        private Long id;
        private String eventName;
        private String eventDate;
        private String eventTime;
        private String location;
        private String venueName;
        private String eventBanner;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
    }
}
