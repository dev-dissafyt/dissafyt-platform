# Dissafyt Platform — Master Documentation

Dissafyt is being designed as a unified business platform rather than a single website.

The platform will provide a shared identity, backend/API, PostgreSQL database, business logic and administrative capabilities. Different customer and staff experiences will sit on top of that common foundation.

## Documentation map

### 01-platform
- `PLATFORM.md` — complete product concept and platform blueprint
- `PRODUCT_SCOPE.md` — what belongs in the platform and what does not

### 02-architecture
- `SYSTEM_ARCHITECTURE.md` — overall technical architecture
- `DATABASE.md` — data architecture and entity model
- `AUTHENTICATION.md` — shared identity/authentication design
- `API.md` — backend/API design
- `AUTHORIZATION.md` — roles, permissions and resource access
- `INFRASTRUCTURE.md` — hosting, environments, domains and deployment

### 03-applications
- `CUSTOMER_APP.md` — public/customer application
- `ADMIN_APP.md` — administration application

### 04-modules
- `BARBERSHOP.md` — barber/service-booking module
- `CLOTHING.md` — clothing/e-commerce module
- `PAYMENTS.md` — payment subsystem
- `NOTIFICATIONS.md` — communication/notification subsystem

### 05-users
- `USER_SYSTEM.md` — unified customer identity and profile model
- `ROLES_AND_PERMISSIONS.md` — access model

### 06-build
- `BUILD_PLAN.md` — phased implementation plan
- `DEVELOPMENT_JOURNAL.md` — template for recording implementation decisions and lessons
- `DECISIONS.md` — architecture decision log

## Core principle

**Build the platform once. Build experiences on top of it.**

```text
                         Dissafyt PLATFORM
                                |
              +-----------------+-----------------+
              |                                   |
       CUSTOMER APPLICATION                  ADMIN APPLICATION
              |                                   |
              +-----------------+-----------------+
                                |
                         API / BACKEND
                                |
              +-----------------+-----------------+
              |                                   |
       AUTHENTICATION                         BUSINESS LOGIC
              |                                   |
              +-----------------+-----------------+
                                |
                         POSTGRESQL DATABASE
```

## Current technology direction

- Customer app: Next.js
- Admin app: Next.js
- Backend/API: API boundary designed from the start; initially may be implemented within the Next.js stack and extracted later if warranted
- Database: PostgreSQL
- Managed platform/auth direction: Supabase
- Hosting direction: Vercel for Next.js applications
- Payment direction: PayFast, subject to final implementation requirements

Technology choices are documented as decisions and may change as the project develops.
