package com.eventbooking.service;

import com.eventbooking.model.Booking;
import com.eventbooking.model.Event;
import com.eventbooking.model.mongo.Notification;
import com.eventbooking.repository.BookingRepository;
import com.eventbooking.repository.mongo.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final BookingRepository      bookingRepository;
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    @Async
    public void sendNotification(Long recipientId, String recipientType,
                                  String type, String title, String message, String actionUrl) {
        try {
            Notification notification = notificationRepository.save(Notification.builder()
                    .recipientId(recipientId)
                    .recipientType(recipientType)
                    .notificationType(type)
                    .title(title)
                    .message(message)
                    .actionUrl(actionUrl)
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build());
            emit(recipientId, recipientType, notification);
        } catch (Exception ex) {
            log.warn("Failed to save notification for {}: {}", recipientId, ex.getMessage());
        }
    }

    public Page<Notification> getNotifications(Long recipientId, String recipientType,
                                                int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository
                .findByRecipientIdAndRecipientTypeOrderByCreatedAtDesc(recipientId, recipientType, pageable);
    }

    public long getUnreadCount(Long recipientId, String recipientType) {
        return notificationRepository
                .countByRecipientIdAndRecipientTypeAndReadFalse(recipientId, recipientType);
    }

    public void markAllRead(Long recipientId, String recipientType) {
        Pageable all = PageRequest.of(0, Integer.MAX_VALUE);
        notificationRepository
                .findByRecipientIdAndRecipientTypeOrderByCreatedAtDesc(recipientId, recipientType, all)
                .getContent()
                .forEach(n -> {
                    n.setRead(true);
                    n.setReadAt(LocalDateTime.now());
                    notificationRepository.save(n);
                });
    }

    public SseEmitter stream(Long recipientId, String recipientType) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        String key = key(recipientId, recipientType);
        emitters.computeIfAbsent(key, ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeEmitter(key, emitter));
        emitter.onTimeout(() -> removeEmitter(key, emitter));
        emitter.onError(ex -> removeEmitter(key, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException ex) {
            removeEmitter(key, emitter);
        }
        return emitter;
    }

    private void emit(Long recipientId, String recipientType, Notification notification) {
        String key = key(recipientId, recipientType);
        List<SseEmitter> active = emitters.getOrDefault(key, new CopyOnWriteArrayList<>());
        for (SseEmitter emitter : active) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
            } catch (IOException ex) {
                removeEmitter(key, emitter);
            }
        }
    }

    private String key(Long recipientId, String recipientType) {
        return recipientType + ":" + recipientId;
    }

    private void removeEmitter(String key, SseEmitter emitter) {
        List<SseEmitter> active = emitters.get(key);
        if (active != null) active.remove(emitter);
    }

    /** Notify all attendees of an event update */
    @Async
    public void notifyEventUpdate(Event event) {
        bookingRepository.findByOrganizerEvents(event.getOrganizer().getId(),
                PageRequest.of(0, 500))
                .getContent()
                .stream()
                .filter(b -> b.getEvent().getId().equals(event.getId())
                        && b.getBookingStatus() == Booking.BookingStatus.CONFIRMED)
                .forEach(b -> sendNotification(
                        b.getUser().getId(), "USER",
                        "EVENT_UPDATED", "Event Updated",
                        event.getEventName() + " has been updated. Check the latest details.",
                        "/events/" + event.getId()));
    }

    /** Notify all attendees of event cancellation */
    @Async
    public void notifyEventCancellation(Event event) {
        bookingRepository.findByOrganizerEvents(event.getOrganizer().getId(),
                PageRequest.of(0, 500))
                .getContent()
                .stream()
                .filter(b -> b.getEvent().getId().equals(event.getId())
                        && b.getBookingStatus() == Booking.BookingStatus.CONFIRMED)
                .forEach(b -> sendNotification(
                        b.getUser().getId(), "USER",
                        "EVENT_CANCELLED", "Event Cancelled",
                        event.getEventName() + " has been cancelled. A refund will be processed.",
                        "/bookings"));
    }
}
