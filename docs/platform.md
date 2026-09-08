# Dissafyt Platform

## Purpose

Dissafyt is a digital business platform designed to provide a unified customer identity and shared infrastructure across multiple business capabilities.

The platform is not limited to one physical business location. Physical businesses can operate through the platform while Dissafyt provides the digital infrastructure connecting customers, service providers, locations, bookings, products, payments and administration.

For the comprehensive technical specification and blueprint, see [01-platform/PLATFORM.md](file:///Users/cl/Desktop/dissafyt-platform/docs/01-platform/PLATFORM.md).

---

## Core Applications

### Customer-facing Web Application
The customer-facing interface at `dissafyt.com`.
Customers can use it to:
- Create and manage an account.
- Manage their profile and notification preferences.
- Discover available services and products.
- Book and reschedule barbering services.
- Purchase clothing products with Courier Guy delivery.
- View unified order and booking history.

### Admin Application
A separate operational portal at `admin.dissafyt.com`.
It communicates with the same backend API and uses the same authentication and authorization system as the customer application.
Administrators can manage:
- Users and role assignments.
- Service providers (barbers) and schedules.
- Products, variants, and categories.
- Customer orders and fulfillment tracking.
- Finance and payment audit logs.
- Platform operational reporting.

### Backend API Boundary
Centralized in `@dissafyt/api`, with an established architectural path for independent container deployment at `api.dissafyt.com`.
The customer application and admin application do not independently implement business rules against the database; they communicate with the authoritative API layer.

### Authentication
Dissafyt uses shared authentication via Supabase Auth so that one user identity is recognized across the platform.

---

## Platform Identity Model

A user's identity is independent from any individual business module.

A customer has one Dissafyt account while interacting with:
- The Barbershop module (Ace of Fyt Grooming).
- The Clothing module (Dissafyt Streetwear).
- Future modules and service extensions.

The platform avoids creating separate accounts for each module.

---

## Business Modules

Modules represent distinct business capabilities:
- **Barbershop Module**: Appointment booking, barber availability, and monthly recurring memberships.
- **Clothing Module**: Streetwear merchandise, size/color variant inventory, Courier Guy shipping, and PayFast checkout.

A module may have its own workflows, entities, and rules while still using shared platform services such as Authentication, User Profiles, Payments, Notifications, API Infrastructure, and Administration.

---

## Physical and Digital Scaling

Dissafyt does not depend on proportional physical expansion.

For the Barbershop module, the platform supports:
- Dissafyt-operated locations.
- Multiple locations.
- Multiple barbers/service providers.
- Independent or affiliated providers.
- Provider-specific services.
- Provider availability.
- Location-specific availability.
- Customer-to-provider relationships.
- Bookings across providers and locations.

This allows the digital platform to expand its service network without Dissafyt having to own a new physical shop for every increase in demand.

---

## Strategic Model

The long-term objective is to move Dissafyt from a single-business operation toward a platform/network model:

1. **Operate and validate one physical service business** (Ace of Fyt flagship).
2. **Document and systemize the workflows** (30-minute booking steps, shop hours, anti-collision rules).
3. **Build those workflows into the platform** (Phases 1–8 complete).
4. **Increase capacity within existing locations** (Multi-barber roster).
5. **Onboard additional providers**.
6. **Support additional locations**.
7. **Expand geographically without requiring proportional ownership of physical premises**.

The physical business serves as a real-world testing and validation environment for the digital platform.

---

## Unified Customer Relationship

The customer is a platform-level entity rather than merely a customer of one module.

A customer's platform profile contains information relevant to multiple modules:
- Account identity
- Profile & contact information
- Booking history
- Service history
- Orders & tracking waybills
- Product purchases
- Preferences & notification settings

---

## Revenue Scalability

Dissafyt is designed so that revenue does not depend exclusively on the founder personally performing every service.

Potential models include:
- Revenue from Dissafyt-operated direct services.
- Platform fees.
- Provider commissions.
- Transaction fees.
- Product margins.
- Future recurring subscription models (Silver, Gold, VIP Club).

---

## Guiding Principle

**Dissafyt scales by increasing the number of customers, transactions, providers, and locations supported by the platform rather than relying only on increasing the founder's personal working hours or physical premises.**
