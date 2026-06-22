-- ═══════════════════════════════════════════════════════════
--  Rural Vehicle Rental & Tracking System — MySQL Schema
--  Database: rural_vehicle_rental
-- ═══════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS rural_vehicle_rental
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rural_vehicle_rental;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                     BIGINT        PRIMARY KEY AUTO_INCREMENT,
    user_code              VARCHAR(20)   NOT NULL UNIQUE,
    full_name              VARCHAR(120)  NOT NULL,
    email                  VARCHAR(160)  NOT NULL UNIQUE,
    mobile                 VARCHAR(20)   NOT NULL UNIQUE,
    password_hash          VARCHAR(255)  NOT NULL,
    date_of_birth          DATE,
    gender                 VARCHAR(20),
    address                TEXT,
    city                   VARCHAR(100),
    state                  VARCHAR(100),
    pin_code               VARCHAR(20),
    latitude               DECIMAL(10,7),
    longitude              DECIMAL(10,7),
    profile_selfie_url     VARCHAR(500),
    aadhaar_url            VARCHAR(500),
    driving_license_url    VARCHAR(500),
    address_proof_url      VARCHAR(500),
    bank_account_number    VARCHAR(50),
    bank_ifsc              VARCHAR(20),
    bank_account_name      VARCHAR(120),
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(20),
    face_verified          BOOLEAN       NOT NULL DEFAULT FALSE,
    email_verified         BOOLEAN       NOT NULL DEFAULT FALSE,
    mobile_verified        BOOLEAN       NOT NULL DEFAULT FALSE,
    kyc_status             VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    account_status         VARCHAR(30)   NOT NULL DEFAULT 'PENDING_VERIFICATION',
    role                   VARCHAR(30)   NOT NULL DEFAULT 'USER',
    rating                 DECIMAL(3,2)  DEFAULT 0.00,
    total_trips            INT           DEFAULT 0,
    wallet_balance         DECIMAL(12,2) DEFAULT 0.00,
    failed_login_attempts  INT           NOT NULL DEFAULT 0,
    account_locked         BOOLEAN       NOT NULL DEFAULT FALSE,
    lock_until             DATETIME,
    last_login_at          DATETIME,
    created_at             DATETIME,
    updated_at             DATETIME,
    INDEX idx_user_email    (email),
    INDEX idx_user_mobile   (mobile),
    INDEX idx_user_code     (user_code),
    INDEX idx_user_kyc      (kyc_status),
    INDEX idx_user_status   (account_status)
);

-- ─── ORGANIZATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
    id                     BIGINT        PRIMARY KEY AUTO_INCREMENT,
    org_code               VARCHAR(20)   NOT NULL UNIQUE,
    org_name               VARCHAR(200)  NOT NULL,
    owner_name             VARCHAR(120)  NOT NULL,
    email                  VARCHAR(160)  NOT NULL UNIQUE,
    mobile                 VARCHAR(20)   NOT NULL UNIQUE,
    password_hash          VARCHAR(255)  NOT NULL,
    gst_number             VARCHAR(20),
    pan_number             VARCHAR(20),
    business_license_url   VARCHAR(500),
    business_proof_url     VARCHAR(500),
    address                TEXT,
    city                   VARCHAR(100),
    state                  VARCHAR(100),
    pin_code               VARCHAR(20),
    latitude               DECIMAL(10,7),
    longitude              DECIMAL(10,7),
    logo_url               VARCHAR(500),
    website                VARCHAR(300),
    bank_account_number    VARCHAR(50),
    bank_ifsc              VARCHAR(20),
    bank_account_name      VARCHAR(120),
    email_verified         BOOLEAN       NOT NULL DEFAULT FALSE,
    mobile_verified        BOOLEAN       NOT NULL DEFAULT FALSE,
    approval_status        VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    account_status         VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE',
    role                   VARCHAR(30)   NOT NULL DEFAULT 'ORGANIZATION',
    rating                 DECIMAL(3,2)  DEFAULT 0.00,
    total_vehicles         INT           DEFAULT 0,
    failed_login_attempts  INT           NOT NULL DEFAULT 0,
    account_locked         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at             DATETIME,
    updated_at             DATETIME,
    INDEX idx_org_email  (email),
    INDEX idx_org_mobile (mobile),
    INDEX idx_org_code   (org_code),
    INDEX idx_org_status (approval_status)
);

-- ─── ADMINS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(120) NOT NULL,
    email          VARCHAR(160) NOT NULL UNIQUE,
    mobile         VARCHAR(20),
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(30)  NOT NULL DEFAULT 'ADMIN',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by     BIGINT,
    last_login_at  DATETIME,
    created_at     DATETIME,
    updated_at     DATETIME,
    INDEX idx_admin_email (email)
);

-- ─── VEHICLES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
    id                     BIGINT        PRIMARY KEY AUTO_INCREMENT,
    vehicle_code           VARCHAR(30)   NOT NULL UNIQUE,
    org_id                 BIGINT        NOT NULL,
    title                  VARCHAR(200)  NOT NULL,
    vehicle_type           VARCHAR(40)   NOT NULL,
    brand                  VARCHAR(80)   NOT NULL,
    model                  VARCHAR(80)   NOT NULL,
    year                   INT,
    registration_number    VARCHAR(30)   NOT NULL UNIQUE,
    fuel_type              VARCHAR(30)   NOT NULL,
    transmission           VARCHAR(20)   NOT NULL DEFAULT 'MANUAL',
    seating_capacity       INT           DEFAULT 4,
    color                  VARCHAR(50),
    price_per_hour         DECIMAL(10,2) NOT NULL,
    security_deposit       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    pickup_latitude        DECIMAL(10,7),
    pickup_longitude       DECIMAL(10,7),
    pickup_address         TEXT,
    city                   VARCHAR(100),
    state                  VARCHAR(100),
    gps_device_id          VARCHAR(60),
    rc_book_url            VARCHAR(500),
    insurance_url          VARCHAR(500),
    pollution_cert_url     VARCHAR(500),
    fitness_cert_url       VARCHAR(500),
    last_service_date      DATE,
    next_service_date      DATE,
    service_due_km         INT,
    last_service_slip_url  VARCHAR(500),
    insurance_expiry       DATE,
    rc_expiry              DATE,
    description            TEXT,
    features               TEXT,
    availability_status    VARCHAR(30)   NOT NULL DEFAULT 'AVAILABLE',
    approval_status        VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    is_featured            BOOLEAN       NOT NULL DEFAULT FALSE,
    rating                 DECIMAL(3,2)  DEFAULT 0.00,
    total_bookings         INT           DEFAULT 0,
    created_at             DATETIME,
    updated_at             DATETIME,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_vehicle_org     (org_id),
    INDEX idx_vehicle_type    (vehicle_type),
    INDEX idx_vehicle_status  (availability_status),
    INDEX idx_vehicle_city    (city),
    INDEX idx_vehicle_approval(approval_status)
);

-- ─── VEHICLE IMAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_images (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    vehicle_id  BIGINT       NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  INT          DEFAULT 0,
    created_at  DATETIME,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_vi_vehicle (vehicle_id)
);

-- ─── BOOKINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
    booking_code            VARCHAR(30)   NOT NULL UNIQUE,
    user_id                 BIGINT        NOT NULL,
    vehicle_id              BIGINT        NOT NULL,
    org_id                  BIGINT        NOT NULL,
    pickup_datetime         DATETIME      NOT NULL,
    return_datetime         DATETIME      NOT NULL,
    actual_pickup_datetime  DATETIME,
    actual_return_datetime  DATETIME,
    total_hours             DECIMAL(8,2),
    hourly_rate             DECIMAL(10,2) NOT NULL,
    base_amount             DECIMAL(12,2) NOT NULL,
    security_deposit        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    platform_fee            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    gst_amount              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    late_fee                DECIMAL(12,2) DEFAULT 0.00,
    additional_charges      DECIMAL(12,2) DEFAULT 0.00,
    total_amount            DECIMAL(12,2) NOT NULL,
    discount_amount         DECIMAL(12,2) DEFAULT 0.00,
    refund_amount           DECIMAL(12,2) DEFAULT 0.00,
    booking_status          VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    payment_status          VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    pickup_otp              VARCHAR(10),
    pickup_otp_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
    return_otp              VARCHAR(10),
    return_otp_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
    cancellation_reason     VARCHAR(500),
    cancelled_at            DATETIME,
    cancelled_by            VARCHAR(30),
    digital_signature_url   VARCHAR(500),
    agreement_accepted      BOOLEAN       NOT NULL DEFAULT FALSE,
    agreement_accepted_at   DATETIME,
    notes                   TEXT,
    created_at              DATETIME,
    updated_at              DATETIME,
    FOREIGN KEY (user_id)    REFERENCES users(id)         ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)      ON DELETE RESTRICT,
    FOREIGN KEY (org_id)     REFERENCES organizations(id) ON DELETE RESTRICT,
    INDEX idx_booking_code   (booking_code),
    INDEX idx_booking_user   (user_id),
    INDEX idx_booking_vehicle(vehicle_id),
    INDEX idx_booking_status (booking_status),
    INDEX idx_booking_dates  (pickup_datetime, return_datetime)
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id                 BIGINT        PRIMARY KEY AUTO_INCREMENT,
    transaction_id     VARCHAR(60)   NOT NULL UNIQUE,
    booking_id         BIGINT        NOT NULL,
    user_id            BIGINT        NOT NULL,
    amount             DECIMAL(12,2) NOT NULL,
    payment_type       VARCHAR(30)   NOT NULL,
    payment_status     VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    payment_method     VARCHAR(40),
    razorpay_order_id  VARCHAR(120),
    razorpay_payment_id VARCHAR(120),
    razorpay_signature VARCHAR(300),
    failure_reason     VARCHAR(300),
    paid_at            DATETIME,
    created_at         DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    INDEX idx_payment_txn     (transaction_id),
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_user    (user_id),
    INDEX idx_payment_status  (payment_status)
);

-- ─── REFUNDS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    id               BIGINT        PRIMARY KEY AUTO_INCREMENT,
    payment_id       BIGINT        NOT NULL,
    booking_id       BIGINT        NOT NULL,
    refund_amount    DECIMAL(12,2) NOT NULL,
    refund_status    VARCHAR(30)   NOT NULL DEFAULT 'INITIATED',
    refund_type      VARCHAR(30)   NOT NULL DEFAULT 'FULL',
    reason           VARCHAR(400),
    razorpay_refund_id VARCHAR(120),
    processed_at     DATETIME,
    created_at       DATETIME,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_refund_payment (payment_id),
    INDEX idx_refund_status  (refund_status)
);

-- ─── VEHICLE CONDITION REPORTS ───────────────────────────────
CREATE TABLE IF NOT EXISTS condition_reports (
    id                 BIGINT       PRIMARY KEY AUTO_INCREMENT,
    booking_id         BIGINT       NOT NULL UNIQUE,
    report_type        VARCHAR(20)  NOT NULL,
    brakes_ok          BOOLEAN      DEFAULT TRUE,
    lights_ok          BOOLEAN      DEFAULT TRUE,
    tyres_ok           BOOLEAN      DEFAULT TRUE,
    horn_ok            BOOLEAN      DEFAULT TRUE,
    engine_ok          BOOLEAN      DEFAULT TRUE,
    fuel_level         VARCHAR(20),
    body_damage        BOOLEAN      DEFAULT FALSE,
    documents_ok       BOOLEAN      DEFAULT TRUE,
    accessories_ok     BOOLEAN      DEFAULT TRUE,
    issues_description TEXT,
    photos             TEXT,
    video_url          VARCHAR(500),
    issue_type         VARCHAR(50),
    user_confirmed     BOOLEAN      DEFAULT FALSE,
    confirmed_at       DATETIME,
    created_at         DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_cr_booking (booking_id)
);

-- ─── GPS TRACKING ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gps_tracking (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    booking_id  BIGINT       NOT NULL,
    vehicle_id  BIGINT       NOT NULL,
    latitude    DECIMAL(10,7) NOT NULL,
    longitude   DECIMAL(10,7) NOT NULL,
    speed_kmph  DECIMAL(6,2),
    heading     DECIMAL(6,2),
    event_type  VARCHAR(30)  DEFAULT 'LOCATION',
    recorded_at DATETIME     NOT NULL,
    INDEX idx_gps_booking  (booking_id),
    INDEX idx_gps_vehicle  (vehicle_id),
    INDEX idx_gps_recorded (recorded_at)
);

CREATE TABLE IF NOT EXISTS service_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id BIGINT NOT NULL,
    service_date DATE NOT NULL,
    odometer_km INT,
    next_service_date DATE,
    next_service_due_km INT,
    service_slip_url VARCHAR(500),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_service_vehicle (vehicle_id),
    INDEX idx_service_due (next_service_date, verification_status)
);

CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    complaint_code VARCHAR(30) NOT NULL UNIQUE,
    booking_id BIGINT,
    raised_by_type VARCHAR(30) NOT NULL,
    raised_by_id BIGINT NOT NULL,
    against_type VARCHAR(30) NOT NULL,
    against_id BIGINT NOT NULL,
    category VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    admin_decision VARCHAR(40),
    fine_amount DECIMAL(12,2) DEFAULT 0.00,
    resolved_at DATETIME,
    created_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_complaint_status (status),
    INDEX idx_complaint_category (category)
);

CREATE TABLE IF NOT EXISTS accident_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    description TEXT,
    photo_urls TEXT,
    fir_number VARCHAR(80),
    insurance_claim_number VARCHAR(120),
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    reported_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_accident_booking (booking_id),
    INDEX idx_accident_status (status)
);

CREATE TABLE IF NOT EXISTS theft_alerts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    alert_source VARCHAR(30) NOT NULL,
    police_complaint_draft TEXT,
    police_verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    final_decision VARCHAR(30),
    created_at DATETIME,
    resolved_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_theft_status (police_verification_status)
);

CREATE TABLE IF NOT EXISTS traffic_violations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    challan_number VARCHAR(80),
    violation_type VARCHAR(80),
    fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    violation_at DATETIME,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    document_url VARCHAR(500),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_violation_booking (booking_id),
    INDEX idx_violation_status (status)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient_type VARCHAR(30) NOT NULL,
    recipient_id BIGINT NOT NULL,
    channel VARCHAR(30) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    read_at DATETIME,
    created_at DATETIME,
    INDEX idx_notification_recipient (recipient_type, recipient_id),
    INDEX idx_notification_status (status)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_type VARCHAR(30) NOT NULL,
    actor_id BIGINT,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT,
    ip_address VARCHAR(80),
    user_agent VARCHAR(300),
    metadata JSON,
    created_at DATETIME NOT NULL,
    INDEX idx_audit_actor (actor_type, actor_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
);
