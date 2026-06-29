package com.eventbooking.repository;

import com.eventbooking.model.TutorialVideo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TutorialVideoRepository extends JpaRepository<TutorialVideo, Long> {
    List<TutorialVideo> findByActiveTrueOrderByCreatedAtDesc();
}
