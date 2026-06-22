# Deployment Guide

## Local

1. Start infrastructure with `docker compose up -d mysql redis`.
2. Start backend with `mvn spring-boot:run`.
3. Start frontend with `npm install` then `npm run dev` from `frontend`.

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | 256-bit signing secret |
| `RAZORPAY_KEY_ID` | Razorpay key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP app password |
| `SMS_API_KEY` | SMS provider key |
| `CLOUDINARY_URL` or `AWS_*` | Media storage |
| `GOOGLE_MAPS_API_KEY` | Maps and geocoding |

## Production Checklist

- Use managed MySQL and Redis with backups enabled.
- Set `spring.jpa.hibernate.ddl-auto=validate` and use migrations for schema changes.
- Serve frontend through CDN/Nginx with HTTPS.
- Rotate JWT, Razorpay, SMTP and storage secrets.
- Enable actuator health probes only on private network.
- Configure centralized logs and alerting for theft, SOS, failed payments and high error rate.
- Run database backup automation and test restore monthly.

