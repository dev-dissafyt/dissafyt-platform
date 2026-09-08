# Dissafyt Platform — Master Documentation

This directory is the working source of truth for the Dissafyt platform.

## Documentation rules

- Business requirements belong in the relevant specification document.
- Important changes in thinking are recorded in `06-build/DEVELOPMENT_JOURNAL.md` (or `journal/development.md`).
- Major architectural decisions are recorded in `06-build/DECISIONS.md` (or `architecture/decisions.md`).
- Database design follows the confirmed business model; it does not define the business model.

## Current core model

Dissafyt is a digital platform that can support multiple business modules. The Barbershop module is designed to scale beyond a single physical shop by supporting multiple service providers and locations through shared platform infrastructure.

The platform has:
- A customer-facing web application.
- A separate administrative application.
- A dedicated backend API boundary (`@dissafyt/api`, with independent deployment at `api.dissafyt.com`).
- Shared authentication via Supabase Auth.
- A shared PostgreSQL database.
- Business modules such as Streetwear Commerce and Ace of Fyt Barbershop.

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
