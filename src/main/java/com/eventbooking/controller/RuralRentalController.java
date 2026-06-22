package com.eventbooking.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1")
public class RuralRentalController {

    private static final List<VehicleDto> VEHICLES = List.of(
            new VehicleDto(1L, "Mahindra Bolero Neo", "SUV", "Mahindra", "Bolero Neo", "Diesel", "Manual",
                    "Madurai", "Available", new BigDecimal("185"), new BigDecimal("3000"), "GPS-MDU-1088",
                    9.9252, 78.1198, 4.8, "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80"),
            new VehicleDto(2L, "Tata Ace Gold", "Mini Truck", "Tata", "Ace Gold", "Diesel", "Manual",
                    "Thanjavur", "Service due soon", new BigDecimal("220"), new BigDecimal("4500"), "GPS-TNJ-2240",
                    10.7870, 79.1378, 4.7, "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80"),
            new VehicleDto(3L, "Honda Activa 6G", "Scooter", "Honda", "Activa 6G", "Petrol", "Automatic",
                    "Dindigul", "Available", new BigDecimal("55"), new BigDecimal("1000"), "GPS-DGL-3341",
                    10.3673, 77.9803, 4.9, "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80")
    );

    @GetMapping("/platform/capabilities")
    public PlatformCapabilities capabilities() {
        return new PlatformCapabilities(
                "Rural Vehicle Rental & Tracking System",
                List.of("USER", "ORGANIZATION", "ADMIN", "SUPER_ADMIN"),
                List.of("KYC", "Organization approval", "Vehicle compliance", "Booking", "Razorpay payment",
                        "Pickup OTP", "Condition report", "GPS tracking", "Complaints", "Theft escalation"),
                List.of("JWT", "Refresh tokens", "Redis OTP", "Role permissions", "Audit logs", "Secure uploads")
        );
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String normalizedRole = request.role() == null || request.role().isBlank()
                ? "USER"
                : request.role().trim().toUpperCase();
        return new AuthResponse(
                "demo-access-token-" + normalizedRole.toLowerCase(),
                "demo-refresh-token-" + normalizedRole.toLowerCase(),
                new AccountDto("RVU-1001", request.fullName(), request.email(), normalizedRole,
                        "PENDING_VERIFICATION", "OTP_SENT"),
                "Registration received. OTP sent to mobile/email. Admin approval is required after document verification."
        );
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String normalizedRole = request.role() == null || request.role().isBlank()
                ? "USER"
                : request.role().trim().toUpperCase();
        return new AuthResponse(
                "demo-access-token-" + normalizedRole.toLowerCase(),
                "demo-refresh-token-" + normalizedRole.toLowerCase(),
                new AccountDto("RVU-1001", "Demo " + normalizedRole, request.email(), normalizedRole,
                        "ACTIVE", "VERIFIED"),
                "Login successful. Use real JWT issuing service when persistence is enabled."
        );
    }

    @PostMapping("/auth/otp/send")
    public OtpResponse sendOtp(@Valid @RequestBody OtpSendRequest request) {
        return new OtpResponse(request.destination(), "OTP_SENT", "123456",
                "Demo OTP is 123456. In production this is stored in Redis and sent by SMS/email.");
    }

    @PostMapping("/auth/otp/verify")
    public OtpResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        String status = "123456".equals(request.otp()) ? "VERIFIED" : "INVALID";
        return new OtpResponse(request.destination(), status, null,
                "123456".equals(request.otp()) ? "OTP verified successfully." : "Invalid demo OTP. Try 123456.");
    }

    @GetMapping("/vehicles")
    public List<VehicleDto> vehicles() {
        return VEHICLES;
    }

    @GetMapping("/vehicles/{id}")
    public VehicleDetailDto vehicle(@PathVariable Long id) {
        VehicleDto vehicle = VEHICLES.stream()
                .filter(item -> item.id().equals(id))
                .findFirst()
                .orElse(VEHICLES.get(0));
        return new VehicleDetailDto(vehicle, List.of("RC verified", "Insurance active", "PUC active",
                "Fitness certificate verified", "Latest service slip uploaded"), List.of(
                new ReviewDto("Ramesh K", 5, "Clean vehicle, quick OTP handover."),
                new ReviewDto("Naveen S", 4, "Good for rural roads and farm visits.")
        ));
    }

    @PostMapping("/bookings/quote")
    public BookingQuoteResponse quote(@Valid @RequestBody BookingQuoteRequest request) {
        VehicleDto vehicle = VEHICLES.stream()
                .filter(item -> item.id().equals(request.vehicleId()))
                .findFirst()
                .orElse(VEHICLES.get(0));
        long hours = Math.max(1, Duration.between(request.pickupAt(), request.returnAt()).toHours());
        BigDecimal rentalCost = vehicle.pricePerHour().multiply(BigDecimal.valueOf(hours));
        BigDecimal platformFee = new BigDecimal("149.00");
        BigDecimal taxes = rentalCost.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = rentalCost.add(vehicle.securityDeposit()).add(platformFee).add(taxes);
        return new BookingQuoteResponse(vehicle.id(), hours, vehicle.pricePerHour(), rentalCost,
                vehicle.securityDeposit(), taxes, platformFee, total);
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingQuoteResponse quote = quote(new BookingQuoteRequest(request.vehicleId(), request.pickupAt(), request.returnAt()));
        return Map.of(
                "bookingCode", "RRB-2026-1042",
                "status", "PAYMENT_PENDING",
                "paymentRequired", true,
                "quote", quote
        );
    }

    @GetMapping("/dashboards/user")
    public DashboardDto userDashboard() {
        return new DashboardDto("User Portal", List.of(
                new StatDto("KYC status", "Pending admin approval"),
                new StatDto("Upcoming booking", "Bolero Neo, 22 Jun 2026"),
                new StatDto("Wallet balance", "₹1,250"),
                new StatDto("Refund status", "1 processing")
        ), List.of("Complete face verification", "Review pickup checklist", "Download last invoice"));
    }

    @GetMapping("/dashboards/organization")
    public DashboardDto organizationDashboard() {
        return new DashboardDto("Organization Portal", List.of(
                new StatDto("Fleet approved", "24"),
                new StatDto("Live rentals", "7"),
                new StatDto("Service due", "3"),
                new StatDto("Monthly revenue", "₹4.8L")
        ), List.of("Upload service slip for TN-58 AB 3344", "Verify pickup OTP", "Respond to vehicle issue complaint"));
    }

    @GetMapping("/dashboards/admin")
    public DashboardDto adminDashboard() {
        return new DashboardDto("Admin Portal", List.of(
                new StatDto("User KYC pending", "42"),
                new StatDto("Vehicle approvals", "18"),
                new StatDto("Refund reviews", "9"),
                new StatDto("Police requests", "3")
        ), List.of("Approve verified documents", "Review theft escalation", "Resolve refund complaint"));
    }

    @GetMapping("/dashboards/super-admin")
    public DashboardDto superAdminDashboard() {
        return new DashboardDto("Super Admin Portal", List.of(
                new StatDto("Platform revenue", "₹18.4L"),
                new StatDto("Active admins", "8"),
                new StatDto("System health", "Healthy"),
                new StatDto("Audit events", "12,904")
        ), List.of("Review platform fee", "Export audit logs", "Schedule database backup"));
    }

    @GetMapping("/admin/approvals")
    public List<ApprovalDto> approvals() {
        return List.of(
                new ApprovalDto("USER", "USR-1042", "Aadhaar and license verification", "PENDING"),
                new ApprovalDto("ORGANIZATION", "ORG-2201", "GST, PAN and business proof", "PENDING"),
                new ApprovalDto("VEHICLE", "VEH-8810", "RC, insurance, PUC, fitness and service slip", "PENDING")
        );
    }

    @GetMapping("/tracking/active")
    public List<TrackingPointDto> activeTracking() {
        return List.of(
                new TrackingPointDto("RRB-2026-1042", "Mahindra Bolero Neo", 9.9252, 78.1198, 42.0, "NORMAL"),
                new TrackingPointDto("RRB-2026-1049", "Tata Ace Gold", 10.7870, 79.1378, 51.0, "SPEED_ALERT")
        );
    }

    @GetMapping("/complaints")
    public List<ComplaintDto> complaints() {
        return List.of(
                new ComplaintDto("CMP-3001", "Vehicle Issue", "Brake noise before pickup", "UNDER_REVIEW"),
                new ComplaintDto("CMP-3002", "Refund", "Partial refund pending", "OPEN"),
                new ComplaintDto("CMP-3003", "Delay", "Late return fee dispute", "INVESTIGATING")
        );
    }

    public record PlatformCapabilities(String product, List<String> portals, List<String> businessCapabilities,
                                       List<String> securityCapabilities) {
    }

    public record RegisterRequest(@NotBlank String fullName, @NotBlank String email, @NotBlank String mobile,
                                  @NotBlank String password, String role) {
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password, String role, boolean rememberMe) {
    }

    public record OtpSendRequest(@NotBlank String destination, String channel) {
    }

    public record OtpVerifyRequest(@NotBlank String destination, @NotBlank String otp) {
    }

    public record AuthResponse(String accessToken, String refreshToken, AccountDto account, String message) {
    }

    public record AccountDto(String code, String name, String email, String role, String accountStatus,
                             String verificationStatus) {
    }

    public record OtpResponse(String destination, String status, String demoOtp, String message) {
    }

    public record VehicleDto(Long id, String name, String type, String brand, String model, String fuelType,
                             String transmission, String city, String status, BigDecimal pricePerHour,
                             BigDecimal securityDeposit, String gpsDeviceId, double latitude, double longitude,
                             double rating, String imageUrl) {
    }

    public record VehicleDetailDto(VehicleDto vehicle, List<String> compliance, List<ReviewDto> reviews) {
    }

    public record ReviewDto(String reviewer, int rating, String comment) {
    }

    public record BookingQuoteRequest(@NotNull Long vehicleId, @NotNull LocalDateTime pickupAt,
                                      @NotNull LocalDateTime returnAt) {
    }

    public record CreateBookingRequest(@NotNull Long vehicleId, @NotNull LocalDateTime pickupAt,
                                       @NotNull LocalDateTime returnAt, @NotBlank String pickupAddress) {
    }

    public record BookingQuoteResponse(Long vehicleId, long hours, BigDecimal hourlyRate, BigDecimal rentalCost,
                                       BigDecimal securityDeposit, BigDecimal taxes, BigDecimal platformFee,
                                       BigDecimal totalAmount) {
    }

    public record DashboardDto(String portal, List<StatDto> stats, List<String> actions) {
    }

    public record StatDto(String label, String value) {
    }

    public record ApprovalDto(String type, String reference, String checklist, String status) {
    }

    public record TrackingPointDto(String bookingCode, String vehicle, double latitude, double longitude,
                                   double speedKmph, String status) {
    }

    public record ComplaintDto(String code, String category, String description, String status) {
    }
}
