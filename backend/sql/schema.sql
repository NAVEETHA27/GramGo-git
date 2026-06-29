-- ╔══════════════════════════════════════════════════════════════════════╗
--  Vehicle Rental Booking System – MySQL Schema
--  Database: vehicle_rental_db
-- ╚══════════════════════════════════════════════════════════════════════╝

CREATE DATABASE IF NOT EXISTS vehicle_rental_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vehicle_rental_db;

-- ─── USERS (Renters) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                    BIGINT        PRIMARY KEY AUTO_INCREMENT,
    user_code             VARCHAR(20)   UNIQUE,
    name                  VARCHAR(120)  NOT NULL,
    email                 VARCHAR(160)  NOT NULL UNIQUE,
    password_hash         VARCHAR(255)  NOT NULL,
    phone                 VARCHAR(20),
    address               VARCHAR(300),
    pin_code              VARCHAR(20),
    organization_name     VARCHAR(160),
    city                  VARCHAR(100),
    state                 VARCHAR(100),
    country               VARCHAR(100),
    date_of_birth         DATE,
    gender                VARCHAR(20),
    profile_picture       VARCHAR(300),
    email_verified        BOOLEAN       NOT NULL DEFAULT FALSE,
    verification_token    VARCHAR(120),
    reset_password_token  VARCHAR(120),
    reset_token_expiry    DATETIME,
    account_locked        BOOLEAN       NOT NULL DEFAULT FALSE,
    failed_login_attempts INT           NOT NULL DEFAULT 0,
    role                  VARCHAR(20)   NOT NULL DEFAULT 'USER',
    created_at            DATETIME,
    updated_at            DATETIME,
    INDEX idx_user_email        (email),
    INDEX idx_user_public_id    (user_code),
    INDEX idx_user_verified     (email_verified)
);

-- ─── FLEET OWNERS (Organizers) ────────────────────────────────────────
-- Note: table name kept as 'organizers' to match Spring Boot JPA mapping.
-- Semantically: organizer = fleet owner / vehicle provider
CREATE TABLE IF NOT EXISTS organizers (
    id                    BIGINT        PRIMARY KEY AUTO_INCREMENT,
    organizer_name        VARCHAR(120)  NOT NULL,   -- fleet owner full name
    organization_name     VARCHAR(160)  NOT NULL,   -- company / fleet name
    email                 VARCHAR(160)  NOT NULL UNIQUE,
    password_hash         VARCHAR(255)  NOT NULL,
    phone                 VARCHAR(20),
    address               VARCHAR(300),
    pin_code              VARCHAR(20),
    city                  VARCHAR(100),
    state                 VARCHAR(100),
    country               VARCHAR(100),
    organization_logo     VARCHAR(300),
    website               VARCHAR(200),
    description           TEXT,
    email_verified        BOOLEAN       NOT NULL DEFAULT FALSE,
    verification_token    VARCHAR(120),
    reset_password_token  VARCHAR(120),
    reset_token_expiry    DATETIME,
    is_approved           BOOLEAN       NOT NULL DEFAULT TRUE,
    role                  VARCHAR(20)   NOT NULL DEFAULT 'ORGANIZER',
    created_at            DATETIME,
    updated_at            DATETIME,
    INDEX idx_org_email (email)
);

CREATE TABLE IF NOT EXISTS profile_locations (
    id           BIGINT         PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT         NULL,
    organizer_id BIGINT         NULL,
    address      VARCHAR(300),
    street       VARCHAR(120),
    area         VARCHAR(120),
    city         VARCHAR(100),
    district     VARCHAR(100),
    state        VARCHAR(100),
    country      VARCHAR(100),
    pin_code     VARCHAR(20),
    latitude     DECIMAL(10,7),
    longitude    DECIMAL(10,7),
    FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_profile_location_user      (user_id),
    UNIQUE INDEX idx_profile_location_organizer (organizer_id)
);

-- ─── VEHICLES (mapped to 'events' table in the DB for JPA compatibility) ─
-- Field mapping:
--   event_name        → vehicle listing title  (e.g. "Toyota Innova Crysta 2023")
--   category          → vehicle type           (CAR | BIKE | SUV | TRUCK | VAN | LUXURY | ELECTRIC | SCOOTER | MINIBUS | OTHER)
--   event_type        → transmission           (MANUAL | AUTOMATIC | OFFLINE default)
--   college_name      → brand                  (e.g. Toyota, Honda)
--   department_name   → model                  (e.g. Innova Crysta, City)
--   vehicle_number    → registration number
--   aadhaar_number    → owner Aadhaar number
--   licence_number    → owner driving licence number
--   ticket_price      → price per day (Rs.)
--   total_seats       → fleet quantity          (how many units available)
--   available_seats   → currently available units
--   venue_name        → pickup area / locality
--   location          → full pickup location / city
--   has_certificate   → insurance included flag
--   tags              → comma-separated specs: e.g. PETROL,AUTOMATIC,SEATS_5
--   event_date/time   → listing date (auto-set, not user-facing)
CREATE TABLE IF NOT EXISTS events (
    id                BIGINT          PRIMARY KEY AUTO_INCREMENT,
    organizer_id      BIGINT          NOT NULL,
    event_name        VARCHAR(200)    NOT NULL,   -- vehicle listing title
    description       TEXT,
    category          VARCHAR(80)     NOT NULL,   -- vehicle type: CAR,BIKE,SUV,TRUCK,VAN,LUXURY,ELECTRIC...
    event_type        VARCHAR(60)     NOT NULL DEFAULT 'OFFLINE',  -- transmission type
    event_banner      VARCHAR(300),               -- vehicle photo URL
    event_images      TEXT,                       -- additional photo URLs
    event_date        DATE            NOT NULL,
    event_time        TIME            NOT NULL,
    end_date          DATE,
    end_time          TIME,
    venue_name        VARCHAR(200),               -- pickup area
    location          VARCHAR(300),               -- city / full location
    google_maps_url   VARCHAR(500),
    ticket_price      DECIMAL(10,2)   NOT NULL DEFAULT 0.00,  -- price per day
    total_seats       INT             NOT NULL,               -- fleet quantity
    available_seats   INT             NOT NULL,               -- available units
    status            VARCHAR(30)     NOT NULL DEFAULT 'DRAFT',
    visibility        VARCHAR(20)     NOT NULL DEFAULT 'PUBLIC',
    is_featured       BOOLEAN         NOT NULL DEFAULT FALSE,
    tags              VARCHAR(400),               -- PETROL,AUTOMATIC,SEATS_5 etc.
    organizer_details TEXT,
    college_name      VARCHAR(200)    DEFAULT NULL,   -- brand
    department_name   VARCHAR(150)    DEFAULT NULL,   -- model
    vehicle_number    VARCHAR(30)     DEFAULT NULL,
    aadhaar_number    VARCHAR(20)     DEFAULT NULL,
    licence_number    VARCHAR(40)     DEFAULT NULL,
    has_certificate   BOOLEAN         NOT NULL DEFAULT FALSE,  -- insurance included
    registration_deadline DATE        DEFAULT NULL,
    priority          VARCHAR(20)     DEFAULT 'MEDIUM',
    version           BIGINT          NOT NULL DEFAULT 0,
    created_at        DATETIME,
    updated_at        DATETIME,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
    INDEX idx_event_status    (status),
    INDEX idx_event_date      (event_date),
    INDEX idx_event_type      (event_type),
    INDEX idx_event_category  (category),
    INDEX idx_event_organizer (organizer_id),
    INDEX idx_event_location  (location(100))
);

-- ─── RENTAL BOOKINGS ──────────────────────────────────────────────────
-- 'quantity' = number of rental days
CREATE TABLE IF NOT EXISTS bookings (
    id                   BIGINT         PRIMARY KEY AUTO_INCREMENT,
    ticket_id            VARCHAR(50)    NOT NULL UNIQUE,   -- rental confirmation code
    user_id              BIGINT         NOT NULL,
    event_id             BIGINT         NOT NULL,          -- vehicle listing ID
    quantity             INT            NOT NULL,          -- rental days
    total_amount         DECIMAL(10,2)  NOT NULL,
    booking_status       VARCHAR(30)    NOT NULL DEFAULT 'CONFIRMED',
    qr_code_path         VARCHAR(300),
    cancellation_reason  VARCHAR(500),
    cancelled_at         DATETIME,
    booked_at            DATETIME,
    updated_at           DATETIME,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_booking_ticket (ticket_id),
    INDEX idx_booking_user   (user_id),
    INDEX idx_booking_event  (event_id),
    INDEX idx_booking_status (booking_status)
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id                BIGINT         PRIMARY KEY AUTO_INCREMENT,
    transaction_id    VARCHAR(60)    NOT NULL UNIQUE,
    booking_id        BIGINT         NOT NULL,
    amount            DECIMAL(10,2)  NOT NULL,
    payment_status    VARCHAR(30)    NOT NULL,
    payment_method    VARCHAR(40),
    gateway_reference VARCHAR(120),
    gateway_order_id  VARCHAR(120),
    failure_reason    VARCHAR(300),
    paid_at           DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_payment_txn     (transaction_id),
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_status  (payment_status)
);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    txn_id          VARCHAR(60)     NOT NULL UNIQUE,
    amount          DECIMAL(10,2)   NOT NULL,
    payment_status  VARCHAR(20)     NOT NULL,
    payment_date    DATETIME,
    user_id         BIGINT          NOT NULL,
    event_id        BIGINT          NOT NULL,
    created_at      DATETIME,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_txn_id     (txn_id),
    INDEX idx_txn_user   (user_id),
    INDEX idx_txn_event  (event_id),
    INDEX idx_txn_status (payment_status)
);

-- ─── REFUNDS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    id               BIGINT         PRIMARY KEY AUTO_INCREMENT,
    payment_id       BIGINT         NOT NULL,
    refund_amount    DECIMAL(10,2)  NOT NULL,
    refund_status    VARCHAR(30)    NOT NULL DEFAULT 'INITIATED',
    reason           VARCHAR(400),
    refund_reference VARCHAR(100),
    refund_date      DATETIME,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_refund_payment (payment_id),
    INDEX idx_refund_status  (refund_status)
);
