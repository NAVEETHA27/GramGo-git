package com.eventbooking.controller;

import com.eventbooking.dto.request.EventRequest;
import com.eventbooking.dto.request.EventSearchRequest;
import com.eventbooking.dto.response.ApiResponse;
import com.eventbooking.dto.response.EventResponse;
import com.eventbooking.dto.response.PagedResponse;
import com.eventbooking.exception.BookingException;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.model.Event;
import com.eventbooking.repository.EventRepository;
import com.eventbooking.security.AuthPrincipal;
import com.eventbooking.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService     eventService;
    private final EventRepository  eventRepository;

    // ── Public ────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<EventResponse>>> searchEvents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String collegeName,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) String organizerName,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @RequestParam(required = false) Boolean freeOnly,
            @RequestParam(defaultValue = "date_asc") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal AuthPrincipal principal) {

        EventSearchRequest req = EventSearchRequest.builder()
                .keyword(keyword).category(category).eventType(eventType)
                .location(location).collegeName(collegeName).departmentName(departmentName)
                .organizerName(organizerName)
                .dateFrom(parseDate(dateFrom, "dateFrom"))
                .dateTo(parseDate(dateTo, "dateTo"))
                .priceMin(priceMin).priceMax(priceMax).freeOnly(freeOnly)
                .sortBy(sortBy).page(page).size(size).build();

        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(eventService.search(req, userId)));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<EventResponse>>> featured() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getFeaturedEvents()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvent(id)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(List.of(
                "CAR", "BIKE", "SUV", "TRUCK", "VAN",
                "LUXURY", "ELECTRIC", "SCOOTER", "MINIBUS", "OTHER")));
    }

    // ── Organizer ─────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created successfully",
                        eventService.createEvent(principal.getId(), request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Event updated",
                eventService.updateEvent(id, principal.getId(), request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        eventService.deleteEvent(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Event deleted", null));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<EventResponse>> cancelEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Event cancelled",
                eventService.cancelEvent(id, principal.getId())));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<EventResponse>> publishEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Event published",
                eventService.publishEvent(id, principal.getId())));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<PagedResponse<EventResponse>>> myEvents(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                eventService.getOrganizerEvents(principal.getId(), status, page, size)));
    }

    /** Upload / replace the banner image for an event the organizer owns. */
    @PostMapping("/{id}/banner")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<String>> uploadBanner(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthPrincipal principal) throws IOException {

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (!event.getOrganizer().getId().equals(principal.getId()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access denied: you do not own this event"));

        String ext      = file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")
                          ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.'))
                          : ".jpg";
        String filename = "event_" + id + "_" + UUID.randomUUID() + ext;
        Path   dir      = Paths.get("uploads/banners");
        Files.createDirectories(dir);
        Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        event.setEventBanner("/uploads/banners/" + filename);
        eventRepository.save(event);
        return ResponseEntity.ok(ApiResponse.success("Banner uploaded", event.getEventBanner()));
    }

    private LocalDate parseDate(String value, String field) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new BookingException("Invalid date format for " + field + ": use YYYY-MM-DD");
        }
    }
}
