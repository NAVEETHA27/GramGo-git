package com.eventbooking.repository;

import com.eventbooking.model.ProfileLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileLocationRepository extends JpaRepository<ProfileLocation, Long> {
    Optional<ProfileLocation> findByUserId(Long userId);
    Optional<ProfileLocation> findByOrganizerId(Long organizerId);
}
