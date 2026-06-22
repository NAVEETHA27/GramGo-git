# Production Architecture

## Backend Layers

`controller` receives REST/WebSocket requests and maps them to DTOs.

`service` owns business rules: KYC approval, booking pricing, payment confirmation, pickup OTP, condition reports, late return, theft escalation, refunds and notifications.

`repository` exposes Spring Data JPA persistence for MySQL aggregates.

`security` contains JWT provider, auth filter, refresh token rotation, role checks, lockout policy and rate limiting hooks.

`integration` contains Razorpay, Cloudinary/S3, Google Maps, SMS and email adapters behind interfaces so test code can replace external systems.

`exception` contains `@RestControllerAdvice` with validation, authorization, duplicate, payment and domain-rule errors.

## Core Aggregates

User, Organization, Vehicle, Booking, Payment, Refund, ConditionReport, TrackingPoint, Complaint, Incident, ServiceRecord, AuditLog and Notification are separate aggregates with DTOs at API boundaries. Admins do not update tables directly; every decision writes an audit log row.

## Security Controls

- BCrypt password hashing.
- Access token TTL of 15 minutes and refresh token rotation.
- Redis-backed OTP with short expiry and resend limits.
- Login lock after repeated failures.
- Method-level role checks for user, organization, admin and super admin.
- File upload allowlist, size limits and virus-scan integration point.
- Strict CORS, security headers and CSRF protection for cookie refresh endpoints.
- Audit log for KYC, payments, refunds, police/theft workflows and admin actions.

## Production Services

- MySQL 8 stores transactional data.
- Redis stores OTP, rate-limit counters, token revocation and hot vehicle availability cache.
- WebSocket/STOMP publishes notifications and tracking updates.
- Razorpay handles orders, signature verification and refunds.
- Cloudinary or S3 stores selfies, documents, vehicle media, damage evidence and agreements.
- SMTP/SMS adapters send OTPs, booking confirmations, reminders and complaint updates.

## Deployment Topology

Frontend runs as static Vite output behind Nginx or CDN. Backend runs as a Spring Boot container. MySQL and Redis should use managed services in production. Secrets must be injected through environment variables or a secret manager.

## Testing Strategy

- Unit tests for pricing, cancellation, late return, theft escalation and service availability rules.
- MVC tests for auth, validation and role boundaries.
- Repository tests for critical queries and date overlap booking checks.
- Contract tests for Razorpay webhook signature verification.
- Frontend component tests for quote, KYC, approval queues and condition report flows.
- End-to-end tests for registration to admin approval, booking payment, pickup OTP and return closure.

