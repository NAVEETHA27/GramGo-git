package com.eventbooking.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingRequest {

    @NotNull(message = "Event ID is required")
    private Long eventId;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 10, message = "Maximum 10 tickets per booking")
    private int quantity;
}
