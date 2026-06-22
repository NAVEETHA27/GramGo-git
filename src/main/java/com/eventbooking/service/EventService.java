package com.eventbooking.service;

import com.eventbooking.dto.request.EventRequest;
import com.eventbooking.dto.request.EventSearchRequest;
import com.eventbooking.dto.response.EventResponse;
import com.eventbooking.dto.response.PagedResponse;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.exception.UnauthorizedException;
import com.eventbooking.model.Event;
import com.eventbooking.model.Organizer;
import com.eventbooking.model.ApprovalRequest;
import com.eventbooking.model.mongo.SearchHistory;
import com.eventbooking.repository.EventRepository;
import com.eventbooking.repository.ApprovalRequestRepository;
import com.eventbooking.repository.OrganizerRepository;
import com.eventbooking.repository.mongo.SearchHistoryRepository;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository         eventRepository;
    private final OrganizerRepository     organizerRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final NotificationService     notificationService;
    private final AuditService auditService;

    // ─── CREATE ───────────────────────────────────────────────────────────

    @Transactional
    public EventResponse createEvent(Long organizerId, EventRequest req) {
        Organizer organizer = organizerRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        Event event = Event.builder()
                .organizer(organizer)
                .eventName(req.getEventName())
                .description(req.getDescription())
                .category(req.getCategory())
                .eventType(req.getEventType())
                .priority(req.getPriority() != null ? req.getPriority() : "MEDIUM")
                .collegeName(req.getCollegeName())
                .departmentName(req.getDepartmentName())
                .vehicleNumber(req.getVehicleNumber())
                .aadhaarNumber(req.getAadhaarNumber())
                .licenceNumber(req.getLicenceNumber())
                .eventDate(req.getEventDate())
                .eventTime(req.getEventTime())
                .endDate(req.getEndDate())
                .endTime(req.getEndTime())
                .registrationDeadline(req.getRegistrationDeadline())
                .venueName(req.getVenueName())
                .location(req.getLocation())
                .googleMapsUrl(req.getGoogleMapsUrl())
                .ticketPrice(req.getTicketPrice())
                .totalSeats(req.getTotalSeats())
                .availableSeats(req.getTotalSeats())
                .status(Event.EventStatus.PENDING_APPROVAL)
                .visibility(req.getVisibility())
                .tags(req.getTags())
                .organizerDetails(req.getOrganizerDetails())
                .hasCertificate(req.isHasCertificate())
                .build();

        event = eventRepository.save(event);
        approvalRequestRepository.save(ApprovalRequest.builder()
                .event(event)
                .organizer(organizer)
                .status(ApprovalRequest.ApprovalStatus.PENDING)
                .build());
        auditService.record(organizerId, "ORGANIZER", "EVENT_CREATED", "EVENT",
                String.valueOf(event.getId()), "Event submitted for approval");
        log.info("Event created: {} by organizer {}", event.getId(), organizerId);
        return toResponse(event);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────

    @Transactional
    public EventResponse updateEvent(Long eventId, Long organizerId, EventRequest req) {
        Event event = getOwnedEvent(eventId, organizerId);
        event.setEventName(req.getEventName());
        event.setDescription(req.getDescription());
        event.setCategory(req.getCategory());
        event.setEventType(req.getEventType());
        event.setPriority(req.getPriority());
        event.setCollegeName(req.getCollegeName());
        event.setDepartmentName(req.getDepartmentName());
        event.setVehicleNumber(req.getVehicleNumber());
        event.setAadhaarNumber(req.getAadhaarNumber());
        event.setLicenceNumber(req.getLicenceNumber());
        event.setEventDate(req.getEventDate());
        event.setEventTime(req.getEventTime());
        event.setEndDate(req.getEndDate());
        event.setEndTime(req.getEndTime());
        event.setRegistrationDeadline(req.getRegistrationDeadline());
        event.setVenueName(req.getVenueName());
        event.setLocation(req.getLocation());
        event.setGoogleMapsUrl(req.getGoogleMapsUrl());
        event.setTicketPrice(req.getTicketPrice());
        event.setTags(req.getTags());
        event.setOrganizerDetails(req.getOrganizerDetails());
        event.setHasCertificate(req.isHasCertificate());
        event.setStatus(Event.EventStatus.PENDING_APPROVAL);
        event.setVisibility(req.getVisibility());
        approvalRequestRepository.save(ApprovalRequest.builder()
                .event(event)
                .organizer(event.getOrganizer())
                .status(ApprovalRequest.ApprovalStatus.PENDING)
                .build());
        notificationService.notifyEventUpdate(event);
        auditService.record(organizerId, "ORGANIZER", "EVENT_EDITED", "EVENT",
                String.valueOf(event.getId()), "Event edited and resubmitted");
        return toResponse(eventRepository.save(event));
    }

    // ─── DELETE ───────────────────────────────────────────────────────────

    @Transactional
    public void deleteEvent(Long eventId, Long organizerId) {
        eventRepository.delete(getOwnedEvent(eventId, organizerId));
        log.info("Event deleted: {}", eventId);
    }

    // ─── CANCEL ───────────────────────────────────────────────────────────

    @Transactional
    public EventResponse cancelEvent(Long eventId, Long organizerId) {
        Event event = getOwnedEvent(eventId, organizerId);
        event.setStatus(Event.EventStatus.CANCELLED);
        event = eventRepository.save(event);
        notificationService.notifyEventCancellation(event);
        auditService.record(organizerId, "ORGANIZER", "EVENT_CANCELLED", "EVENT",
                String.valueOf(event.getId()), "Event cancelled by organizer");
        return toResponse(event);
    }

    // ─── PUBLISH ──────────────────────────────────────────────────────────

    @Transactional
    public EventResponse publishEvent(Long eventId, Long organizerId) {
        Event event = getOwnedEvent(eventId, organizerId);
        if (event.getStatus() != Event.EventStatus.APPROVED && event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new UnauthorizedException("Admin approval is required before publishing");
        }
        event.setStatus(Event.EventStatus.PUBLISHED);
        auditService.record(organizerId, "ORGANIZER", "EVENT_PUBLISHED", "EVENT",
                String.valueOf(event.getId()), "Approved event published");
        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse reviewEvent(Long eventId, Long adminId, String decision, String reason) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        ApprovalRequest approval = approvalRequestRepository.findFirstByEventIdOrderByRequestedAtDesc(eventId)
                .orElseGet(() -> ApprovalRequest.builder().event(event).organizer(event.getOrganizer()).build());
        switch (decision.toUpperCase()) {
            case "APPROVE" -> {
                event.setStatus(Event.EventStatus.APPROVED);
                approval.setStatus(ApprovalRequest.ApprovalStatus.APPROVED);
                notificationService.sendNotification(event.getOrganizer().getId(), "ORGANIZER", "EVENT_APPROVED",
                        "Event approved", event.getEventName() + " has been approved. You can publish it now.", "/organizer/events");
            }
            case "REJECT" -> {
                event.setStatus(Event.EventStatus.REJECTED);
                approval.setStatus(ApprovalRequest.ApprovalStatus.REJECTED);
                approval.setReviewNote(reason);
                notificationService.sendNotification(event.getOrganizer().getId(), "ORGANIZER", "EVENT_REJECTED",
                        "Event rejected", reason != null ? reason : "Your event was rejected.", "/organizer/events");
            }
            case "REQUEST_MODIFICATIONS" -> {
                event.setStatus(Event.EventStatus.REJECTED);
                approval.setStatus(ApprovalRequest.ApprovalStatus.MODIFICATION_REQUESTED);
                approval.setReviewNote(reason);
                notificationService.sendNotification(event.getOrganizer().getId(), "ORGANIZER", "EVENT_MODIFICATION_REQUESTED",
                        "Changes requested", reason != null ? reason : "Admin requested modifications.", "/organizer/events");
            }
            default -> throw new IllegalArgumentException("Unsupported approval decision");
        }
        approval.setReviewedBy(adminId);
        approvalRequestRepository.save(approval);
        auditService.record(adminId, "ADMIN", "ADMIN_APPROVAL_" + decision.toUpperCase(), "EVENT",
                String.valueOf(eventId), reason);
        return toResponse(eventRepository.save(event));
    }

    // ─── GET ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public EventResponse getEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if (event.getVisibility() != Event.EventVisibility.PUBLIC
                || event.getStatus() == Event.EventStatus.DRAFT) {
            throw new ResourceNotFoundException("Event not found: " + eventId);
        }

        return toResponse(event);
    }

    // ─── SEARCH ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<EventResponse> search(EventSearchRequest req, Long userId) {
        Specification<Event> spec = buildSpec(req);
        Pageable pageable = PageRequest.of(req.getPage(), req.getSize(), buildSort(req.getSortBy()));
        Page<Event> page = eventRepository.findAll(spec, pageable);

        if (userId != null && StringUtils.hasText(req.getKeyword()))
            saveSearchHistory(userId, req, (int) page.getTotalElements());

        return toPagedResponse(page);
    }

    // ─── ORGANIZER EVENTS ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<EventResponse> getOrganizerEvents(Long organizerId, String status, int page, int size) {
        Event.EventStatus st = status != null ? Event.EventStatus.valueOf(status) : null;
        Page<Event> result = eventRepository.findByOrganizerIdAndStatus(organizerId, st,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPagedResponse(result);
    }

    // ─── FEATURED / UPCOMING ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EventResponse> getFeaturedEvents() {
        return eventRepository.findUpcomingPublicEvents(LocalDate.now())
                .stream().limit(6).map(this::toResponse).toList();
    }

    // ─── SCHEDULED: auto-complete past events ─────────────────────────────

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void autoCompletePastEvents() {
        int updated = eventRepository.markPastEventsCompleted(LocalDate.now());
        log.info("Auto-completed {} past events", updated);
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────

    private Event getOwnedEvent(Long eventId, Long organizerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        if (!event.getOrganizer().getId().equals(organizerId))
            throw new UnauthorizedException("Unauthorized Access: you do not own this event");
        return event;
    }

    private Specification<Event> buildSpec(EventSearchRequest req) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("visibility"), Event.EventVisibility.PUBLIC));
            predicates.add(root.get("status").in(
                    Event.EventStatus.PUBLISHED));

            if (StringUtils.hasText(req.getKeyword())) {
                String like = "%" + req.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("eventName")),   like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("tags")),        like),
                        cb.like(cb.lower(root.get("location")),    like),
                        cb.like(cb.lower(root.get("collegeName")), like),
                        cb.like(cb.lower(root.get("departmentName")), like)
                ));
            }
            if (StringUtils.hasText(req.getCategory()))
                predicates.add(cb.equal(cb.lower(root.get("category")), req.getCategory().toLowerCase()));
            if (StringUtils.hasText(req.getEventType()))
                predicates.add(cb.equal(cb.lower(root.get("eventType")), req.getEventType().toLowerCase()));
            if (StringUtils.hasText(req.getLocation()))
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + req.getLocation().toLowerCase() + "%"));
            if (StringUtils.hasText(req.getCollegeName()))
                predicates.add(cb.like(cb.lower(root.get("collegeName")), "%" + req.getCollegeName().toLowerCase() + "%"));
            if (StringUtils.hasText(req.getDepartmentName()))
                predicates.add(cb.like(cb.lower(root.get("departmentName")), "%" + req.getDepartmentName().toLowerCase() + "%"));
            if (req.getDateFrom() != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("eventDate"), req.getDateFrom()));
            if (req.getDateTo() != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("eventDate"), req.getDateTo()));
            if (req.getPriceMin() != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("ticketPrice"), req.getPriceMin()));
            if (req.getPriceMax() != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("ticketPrice"), req.getPriceMax()));
            if (Boolean.TRUE.equals(req.getFreeOnly()))
                predicates.add(cb.equal(root.get("ticketPrice"), java.math.BigDecimal.ZERO));
            if (StringUtils.hasText(req.getOrganizerName())) {
                Join<Object, Object> org = root.join("organizer", JoinType.LEFT);
                predicates.add(cb.like(cb.lower(org.get("organizerName")), "%" + req.getOrganizerName().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by("eventDate").ascending();
        return switch (sortBy.toLowerCase()) {
            case "price_asc"  -> Sort.by("ticketPrice").ascending();
            case "price_desc" -> Sort.by("ticketPrice").descending();
            case "date_desc"  -> Sort.by("eventDate").descending();
            case "popular"    -> Sort.by("totalSeats").descending();
            default           -> Sort.by("eventDate").ascending();
        };
    }

    @Async
    protected void saveSearchHistory(Long userId, EventSearchRequest req, int resultCount) {
        try {
            searchHistoryRepository.save(SearchHistory.builder()
                    .userId(userId).keyword(req.getKeyword()).category(req.getCategory())
                    .eventType(req.getEventType()).location(req.getLocation())
                    .resultCount(resultCount).searchedAt(LocalDateTime.now()).build());
        } catch (Exception ex) {
            log.warn("Search history save failed: {}", ex.getMessage());
        }
    }

    private PagedResponse<EventResponse> toPagedResponse(Page<Event> page) {
        return PagedResponse.<EventResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }

    public EventResponse toResponse(Event e) {
        return EventResponse.builder()
                .id(e.getId()).eventName(e.getEventName()).description(e.getDescription())
                .category(e.getCategory()).eventType(e.getEventType()).priority(e.getPriority())
                .collegeName(e.getCollegeName()).departmentName(e.getDepartmentName())
                .vehicleNumber(e.getVehicleNumber()).aadhaarNumber(e.getAadhaarNumber()).licenceNumber(e.getLicenceNumber())
                .eventBanner(e.getEventBanner()).eventDate(e.getEventDate()).eventTime(e.getEventTime())
                .endDate(e.getEndDate()).endTime(e.getEndTime())
                .registrationDeadline(e.getRegistrationDeadline())
                .venueName(e.getVenueName()).location(e.getLocation()).googleMapsUrl(e.getGoogleMapsUrl())
                .ticketPrice(e.getTicketPrice()).totalSeats(e.getTotalSeats()).availableSeats(e.getAvailableSeats())
                .status(e.getStatus()).visibility(e.getVisibility()).featured(e.isFeatured())
                .hasCertificate(e.isHasCertificate()).tags(e.getTags()).organizerDetails(e.getOrganizerDetails())
                .createdAt(e.getCreatedAt())
                .organizer(e.getOrganizer() != null
                        ? EventResponse.OrganizerInfo.builder()
                                .id(e.getOrganizer().getId())
                                .organizerName(e.getOrganizer().getOrganizerName())
                                .organizationName(e.getOrganizer().getOrganizationName())
                                .organizationLogo(e.getOrganizer().getOrganizationLogo()).build()
                        : null)
                .build();
    }
}
