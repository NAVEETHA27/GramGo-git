# 🚗 Rural Vehicle Rental & Tracking System

> Enterprise-grade, production-ready vehicle rental platform.  
> Final-year Engineering Capstone Project & Real-World Startup MVP.

---

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Backend     | Java 17, Spring Boot 3.2.5, Spring Security 6, JWT, Redis, WebSocket |
| Database    | MySQL 8 (primary), Redis 7 (cache/OTP) |
| Payments    | Razorpay (full, partial, refund) |
| Storage     | Cloudinary (images/documents) |
| Maps        | Google Maps API |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion |
| State       | React Query (TanStack Query v5), Zustand |
| API Client  | Axios |
| Realtime    | WebSocket (STOMP), SSE |

---

## Four Portals

| Portal | Roles | Key Features |
|--------|-------|-------------|
| User Portal | USER | KYC, browse, book, pay, track, GPS, SOS |
| Organization Portal | ORGANIZATION | Fleet management, vehicle docs, bookings |
| Admin Portal | ADMIN | Approvals, complaints, analytics, blocks |
| Super Admin | SUPER_ADMIN | Platform config, revenue, audit, DB backup |

---

## Quick Start

### Prerequisites
- Java 17+, Maven 3.9+
- Node 20+, pnpm
- MySQL 8, Redis 7
- Docker & Docker Compose (optional)

### Run with Docker Compose
```bash
cd rural-rental
docker-compose up -d
```

### Backend
```bash
cd rural-rental/backend
cp .env.example .env   # fill in your values
mvn spring-boot:run
```

### Frontend
```bash
cd rural-rental/frontend
pnpm install
pnpm dev
```

---

## API Documentation
Swagger UI: `http://localhost:8080/api/swagger-ui.html`

---

## Default Ports
- Backend API: `8080`
- Frontend Dev: `5173`
- MySQL: `3306`
- Redis: `6379`

---

## Project Structure
```
rural-rental/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/ruralvehicle/
│   │   ├── config/             # Security, Redis, WebSocket, CORS
│   │   ├── controller/         # REST API controllers
│   │   ├── service/            # Business logic
│   │   ├── repository/         # JPA repositories
│   │   ├── model/              # JPA entities
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── security/           # JWT, OAuth2, filters
│   │   ├── exception/          # Global error handling
│   │   ├── util/               # Utilities
│   │   └── websocket/          # WebSocket handlers
│   └── src/main/resources/
│       └── application.yml
├── frontend/                   # React 19 + TypeScript
│   ├── src/
│   │   ├── api/                # Axios API layer
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components (4 portals)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Helper utilities
│   └── vite.config.ts
├── sql/
│   └── schema.sql              # Complete MySQL DDL
├── docker-compose.yml
└── .env.example
```

---

## Key Business Rules
- Payment is mandatory before booking confirmation
- OTP-verified vehicle handover
- Hourly billing with automatic late fee
- 5-day no-return triggers theft alert + police complaint draft
- Vehicle unavailable if service slip not uploaded within due date
- Pre/post rental condition report with photo/video
- Digital rental agreement with digital signature
- Traffic violations billed to current renter
