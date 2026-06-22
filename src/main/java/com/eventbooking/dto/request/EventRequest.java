package com.eventbooking.dto.request;

import com.eventbooking.model.Event;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRequest {

    @NotBlank(message = "Event name is required")
    @Size(min = 3, max = 200)
    private String eventName;

    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Event type is required")
    private String eventType;

    private String priority;

    // Vehicle-specific
    @NotBlank(message = "Vehicle number is required")
    private String vehicleNumber;

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be 12 digits")
    private String aadhaarNumber;

    @NotBlank(message = "Licence number is required")
    private String licenceNumber;

    // Vehicle make/model are mapped from the legacy event columns.
    private String collegeName;
    private String departmentName;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    @NotNull(message = "Event time is required")
    private LocalTime eventTime;

    private LocalDate endDate;
    private LocalTime endTime;
    private LocalDate registrationDeadline;

    private String venueName;
    private String location;
    private String googleMapsUrl;

    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    @NotNull(message = "Ticket price is required")
    private BigDecimal ticketPrice;

    @Min(value = 1, message = "Total seats must be at least 1")
    @NotNull(message = "Total seats is required")
    private Integer totalSeats;

    private String tags;
    private String organizerDetails;
    private boolean hasCertificate;

    @NotNull
    @Builder.Default
    private Event.EventStatus status = Event.EventStatus.DRAFT;

    @NotNull
    @Builder.Default
    private Event.EventVisibility visibility = Event.EventVisibility.PUBLIC;
}
