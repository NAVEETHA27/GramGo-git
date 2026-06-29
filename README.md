# 🚗 VehicleRent

Rural Vehicle Rental & Tracking Platform

## Project Structure

```
VehicleRent/
├── backend/        ← Spring Boot 3 REST API (Java 17)
├── frontend/       ← React 18 + Vite + TailwindCSS SPA
├── web/            ← Lightweight prototype (vanilla JS)
└── rural-rental/   ← Architecture & spec documents
```

## Quick Start

### Backend
```bash
cd backend
docker compose up -d        # start MySQL + MongoDB
mvn spring-boot:run         # starts on :8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # starts on :3000
```

## Environment Setup

**Backend** — copy `backend/.env.example` → `backend/.env` and fill in:
- `DB_PASSWORD`, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `CORS_ALLOWED_ORIGINS`

**Frontend** — copy `frontend/.env.example` → `frontend/.env.local` and fill in:
- `VITE_API_BASE_URL` (leave empty for local dev — Vite proxy handles it)
- `VITE_RAZORPAY_KEY_ID`

## API Docs
Swagger UI: `http://localhost:8080/api/swagger-ui.html`

## Portals
| Portal | Role | URL |
|--------|------|-----|
| Renter | USER | `/dashboard` |
| Fleet Owner | ORGANIZER | `/organizer/dashboard` |
| Admin | ADMIN | `/admin/dashboard` |
