# VehicleRent — Spring Boot Backend

Java 17 + Spring Boot 3.2.5 REST API for the Vehicle Rental platform.

## Tech Stack
- **Java 17** + Spring Boot 3.2.5
- **Spring Security** — JWT authentication, role-based access
- **Spring Data JPA** — MySQL (primary database)
- **Spring Data MongoDB** — notifications and audit logs
- **Razorpay** — payment gateway
- **Gmail SMTP** — OTP and booking confirmation emails
- **ZXing** — QR code generation for bookings
- **SpringDoc OpenAPI** — Swagger UI at `/api/swagger-ui.html`

## Project Structure
```
backend/
├── src/main/java/com/eventbooking/
│   ├── config/          # Security, WebConfig
│   ├── controller/      # REST API controllers
│   ├── dto/             # Request/Response DTOs
│   ├── exception/       # Global exception handling
│   ├── model/           # JPA entities + MongoDB documents
│   ├── repository/      # JPA + MongoDB repositories
│   ├── security/        # JWT filter, token provider, OTP store
│   ├── service/         # Business logic
│   └── util/            # QR code generator, Booking ID generator
├── src/main/resources/
│   └── application.yml  # App configuration
├── src/test/            # Unit/property tests
├── sql/schema.sql       # MySQL DDL
├── docker-compose.yml   # MySQL + MongoDB containers
├── pom.xml              # Maven build
└── .env.example         # Environment variable template
```

## Quick Start

### 1. Start databases
```bash
docker compose up -d
```

### 2. Set environment variables
```bash
# Windows CMD
set DB_PASSWORD=your_mysql_password
set JWT_SECRET=your-long-random-secret-min-32-chars
set MAIL_USERNAME=you@gmail.com
set MAIL_PASSWORD=your-gmail-app-password
set RAZORPAY_KEY_ID=rzp_test_xxxx
set RAZORPAY_KEY_SECRET=xxxx
set CORS_ALLOWED_ORIGINS=http://localhost:3000

# Windows PowerShell
$env:DB_PASSWORD="your_mysql_password"
$env:JWT_SECRET="your-long-random-secret-min-32-chars"
```

### 3. Run
```bash
mvn spring-boot:run
```

API base URL: `http://localhost:8080/api`
Swagger UI:   `http://localhost:8080/api/swagger-ui.html`

## Key Endpoints

| Group | Base Path |
|-------|-----------|
| Auth | `/api/auth` |
| Vehicles (listings) | `/api/events` |
| Rentals (bookings) | `/api/bookings` |
| Payments | `/api/payments` |
| User profile | `/api/user` |
| Fleet owner | `/api/organizer` |
| Admin | `/api/admin` |
| Notifications | `/api/notifications` |

## CORS Configuration
Set `CORS_ALLOWED_ORIGINS` to your frontend URL(s):
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

## Build JAR
```bash
mvn clean package -DskipTests
java -jar target/vehicle-rental-system-1.0.0.jar
```
