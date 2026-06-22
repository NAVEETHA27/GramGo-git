# Rural Vehicle Rental & Tracking System API

Base URL: `/api/v1`

Authentication: JWT access token in `Authorization: Bearer <token>` plus HTTP-only refresh token for browser clients.

## Auth

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register/user` | Public | Register user with KYC metadata and uploaded document URLs |
| POST | `/auth/register/organization` | Public | Register rental provider for approval |
| POST | `/auth/login` | Public | Role-aware login with account lock checks |
| POST | `/auth/refresh` | Public | Issue new access token |
| POST | `/auth/otp/send` | Public | Send OTP through Redis-backed expiry store |
| POST | `/auth/otp/verify` | Public | Verify mobile/email OTP |
| POST | `/auth/logout` | Authenticated | Revoke refresh token |

## Users

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/users/me` | USER | Current profile and KYC status |
| PUT | `/users/me` | USER | Update profile, bank, emergency contact |
| POST | `/users/me/selfie` | USER | Store live selfie URL and face score |
| GET | `/users/bookings` | USER | Booking history |
| GET | `/users/favorites` | USER | Favorite vehicles |
| POST | `/users/favorites/{vehicleId}` | USER | Add favorite |

## Organizations

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/organizations/me` | ORGANIZATION | Provider profile and approval status |
| PUT | `/organizations/me` | ORGANIZATION | Update business details |
| POST | `/organizations/vehicles` | ORGANIZATION | Create vehicle with compliance documents |
| PUT | `/organizations/vehicles/{id}` | ORGANIZATION | Update pricing, service and availability |
| POST | `/organizations/bookings/{id}/pickup/verify` | ORGANIZATION | Verify person, ID, face match and pickup OTP |
| POST | `/organizations/bookings/{id}/return` | ORGANIZATION | Complete return inspection |

## Vehicles

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/vehicles` | Public | Search, filter, sort, geospatial browse |
| GET | `/vehicles/{id}` | Public | Vehicle detail, rating, documents status, availability |
| GET | `/vehicles/{id}/availability` | Public | Date/time availability check |
| POST | `/vehicles/{id}/reviews` | USER | Review completed rental |

## Bookings

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/bookings/quote` | USER | Calculate hours, rent, deposit, taxes, fee and total |
| POST | `/bookings` | USER | Create pending booking before payment |
| POST | `/bookings/{id}/pay` | USER | Create Razorpay order |
| POST | `/bookings/{id}/payment/verify` | USER | Confirm booking after payment signature verification |
| POST | `/bookings/{id}/cancel` | USER | Apply cancellation policy and initiate refund |
| POST | `/bookings/{id}/condition-reports` | USER, ORGANIZATION | Pickup/return checklist with issue media |
| GET | `/bookings/{id}/invoice` | USER, ORGANIZATION, ADMIN | Download GST invoice/receipt |

## Tracking And Incidents

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/tracking/location` | ORGANIZATION, SYSTEM | GPS device location ingest |
| GET | `/tracking/bookings/{id}` | USER, ORGANIZATION, ADMIN | Trip path, speed and alerts |
| POST | `/incidents/sos` | USER | Emergency SOS with current GPS point |
| POST | `/incidents/accidents` | USER | Accident report with photos, FIR number and insurance details |
| POST | `/incidents/theft` | ORGANIZATION, ADMIN | Theft complaint and police draft workflow |
| POST | `/incidents/violations` | ADMIN, ORGANIZATION | Traffic challan assignment to current renter |

## Admin And Super Admin

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/dashboard` | ADMIN | Operational metrics and queues |
| GET | `/admin/approvals` | ADMIN | User, organization and vehicle approval queues |
| POST | `/admin/approvals/{type}/{id}` | ADMIN | Approve/reject with reason |
| GET | `/admin/complaints` | ADMIN | Complaint investigation console |
| POST | `/admin/complaints/{id}/decision` | ADMIN | Warning, fine, refund, suspension or ban |
| POST | `/admin/users/{id}/block` | ADMIN | Temporary/permanent account block |
| GET | `/super-admin/admins` | SUPER_ADMIN | Manage admin accounts |
| PUT | `/super-admin/settings` | SUPER_ADMIN | Platform fees, taxes and feature flags |
| GET | `/super-admin/audit-logs` | SUPER_ADMIN | Legal and security audit trail |

## WebSocket Topics

| Topic | Audience | Payload |
| --- | --- | --- |
| `/topic/notifications/{accountId}` | Account owner | Booking, refund, complaint, approval, reminder |
| `/topic/tracking/{bookingId}` | Active rental parties | GPS point, speed alert, SOS |
| `/topic/admin/alerts` | Admins | Theft, accident, overdue service, late return |

