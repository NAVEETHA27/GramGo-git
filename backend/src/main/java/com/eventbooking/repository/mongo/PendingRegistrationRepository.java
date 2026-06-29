package com.eventbooking.repository.mongo;

import com.eventbooking.model.mongo.PendingRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PendingRegistrationRepository extends MongoRepository<PendingRegistration, String> {
    Optional<PendingRegistration> findByEmailAndRole(String email, String role);
    void deleteByEmailAndRole(String email, String role);
}
