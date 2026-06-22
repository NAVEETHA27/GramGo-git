package com.eventbooking.repository;

import com.eventbooking.model.BookingQueueEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingQueueRepository extends JpaRepository<BookingQueueEntry, String> {
}
