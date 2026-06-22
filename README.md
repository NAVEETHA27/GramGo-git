# GramGo

College event discovery and ticket booking platform for students and organizers.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3, Java 17, Spring Security, JWT |
| Frontend | React 18, Vite, TailwindCSS, React Query |
| Databases | MySQL (primary), MongoDB (logs/notifications) |

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
```

### 3. Run backend

```bash
mvn spring-boot:run
```

API base: `http://localhost:8080/api`

### 4. Run frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

## Auth flows

- **Students** — register/login at `/register?role=user` → OTP at `/verify-otp/user`
- **Organizers** — register/login at `/register?role=organizer` → OTP at `/verify-otp/organizer`
- Unverified accounts are prompted for OTP on login

## Project structure

```
EventBookingSystem/
├── src/main/java/com/eventbooking/   # Spring Boot backend
├── frontend/src/                     # React SPA
├── docker-compose.yml              # MySQL + MongoDB
└── uploads/                        # Local file storage (banners, avatars, QR)
```

## API docs

All endpoints are prefixed with `/api`. Key groups:

- `/auth/*` — registration, login, OTP, password reset
- `/events/*` — public search + organizer CRUD
- `/bookings/*` — student ticket booking
- `/user/*`, `/organizer/*` — profile management

## Development profile

Run with `SPRING_PROFILES_ACTIVE=dev` to enable the `/auth/test-email` SMTP test endpoint.

## Security notes

- Never commit real credentials — use environment variables
- Set a strong `JWT_SECRET` in production
- OTP codes are never logged server-side

