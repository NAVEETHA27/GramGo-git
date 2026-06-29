package com.eventbooking.model.mongo;

import com.eventbooking.dto.request.OrganizerRegisterRequest;
import com.eventbooking.dto.request.UserRegisterRequest;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "pending_registrations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PendingRegistration {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Indexed
    private String role;

    private UserRegisterRequest userRequest;
    private OrganizerRegisterRequest organizerRequest;

    private Instant createdAt;
    private Instant expiresAt;
}
