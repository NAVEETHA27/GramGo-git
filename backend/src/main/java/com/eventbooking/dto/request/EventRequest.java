package com.eventbooking.dto.request;

import com.eventbooking.model.Event;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRequest {

    @NotBlank(message = "Vehicle title is required")
    @Size(min = 3, max = 200)
    private String eventName;

    private String description;

    @NotBlank(message = "Vehicle category is required")
    private String category;

    @NotBlank(message = "Transmission type is required")
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

    // Brand stored in collegeName, model in departmentName (legacy field mapping)
    private String collegeName;
    private String departmentName;

    @NotNull(message = "Listing date is required")
    private LocalDate eventDate;

    @NotNull(message = "Listing time is required")
    private LocalTime eventTime;

    private LocalDate endDate;
    private LocalTime endTime;
    private LocalDate registrationDeadline;

    private String venueName;
    private String location;
    private String googleMapsUrl;

    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    @NotNull(message = "Rental price per day is required")
    private BigDecimal ticketPrice;

    @Min(value = 1, message = "Fleet quantity must be at least 1")
    @NotNull(message = "Fleet quantity is required")
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
