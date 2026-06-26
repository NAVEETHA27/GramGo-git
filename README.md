# VehicleRent

Rural Vehicle Rental & Tracking Platform — rent cars, bikes, SUVs, trucks and more.

## Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Spring Boot 3, Java 17, Spring Security, JWT |
| Frontend  | React 18, Vite, TailwindCSS, React Query |
| Databases | MySQL 8 (primary), MongoDB 7 (logs/notifications) |
| Payments  | Razorpay (full, partial, refund) |

## Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8
- MongoDB 7 (optional — app starts without it)
- Gmail account with App Password (for OTP emails)

## Quick start

### 1. Start databases (Docker)

```bash
docker compose up -d
```

### 2. Configure environment

Copy `.env.example` and set values, or export variables before starting the backend:

```powershell
$env:DB_PASSWORD="your_mysql_password"
$env:JWT_SECRET="a-long-random-secret-at-least-32-chars"
$env:MAIL_USERNAME="you@gmail.com"
$env:MAIL_PASSWORD="your-gmail-app-password"
$env:RAZORPAY_KEY_ID="rzp_test_xxxx"
$env:RAZORPAY_KEY_SECRET="xxxx"
```

### 3. Run backend

```bash
mvn spring-boot:run
```

API base: `http://localhost:8080/api`
Swagger UI: `http://localhost:8080/api/swagger-ui.html`

### 4. Run frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

## User flows

- **Renters** — register/login at `/register?role=user` → OTP at `/verify-otp/user`
- **Fleet Owners** — register/login at `/register?role=organizer` → OTP at `/verify-otp/organizer`
- Unverified accounts are prompted for OTP verification on login

## Project structure

```
VehicleRent/
├── src/main/java/com/eventbooking/   # Spring Boot backend
├── frontend/src/                     # React SPA
├── docker-compose.yml                # MySQL + MongoDB
├── sql/schema.sql                    # MySQL DDL
└── uploads/                          # Local file storage (vehicle photos, QR codes)
```

## API endpoint groups

All endpoints are prefixed with `/api`:

- `/auth/*` — registration, login, OTP, password reset
- `/events/*` — vehicle listing search + fleet owner CRUD
- `/bookings/*` — renter rental booking
- `/payments/*` — Razorpay integration, refunds
- `/user/*`, `/organizer/*` — profile management
- `/admin/*` — approvals, analytics, fleet management
- `/notifications/*` — real-time SSE notifications

## Four portals

| Portal | Role | Path |
|--------|------|------|
| Renter Portal | USER | `/dashboard` |
| Fleet Owner Portal | ORGANIZER | `/organizer/dashboard` |
| Admin Portal | ADMIN | `/admin/dashboard` |

## Development

Run with `SPRING_PROFILES_ACTIVE=dev` to enable the `/auth/test-email` SMTP test endpoint.

## Security notes

- Never commit real credentials — use environment variables
- Set a strong `JWT_SECRET` (min 32 chars) in production
- OTP codes are never logged server-side
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days
