# Dissafyt Barbershop Module

## Purpose

The Barbershop module provides the digital infrastructure for booking and managing barbering services.

It is designed to work with one or many physical locations and one or many service providers.

For the full specification and schema rules, see [04-modules/BARBERSHOP.md](file:///Users/cl/Desktop/dissafyt-platform/docs/04-modules/BARBERSHOP.md).

---

## Core Entities

The business model separates:
- **Customer**
- **Service provider**
- **Location**
- **Service**
- **Availability**
- **Booking**

These entities must not be treated as interchangeable.

### Customer
A customer has a platform-level Dissafyt account and can interact with the Barbershop module.
Customer information includes:
- Name
- Contact information
- Booking history
- Service history
- Preferences
- Relevant notes & delivery details

### Service Provider
A service provider is a person who provides barbering or related services.
A provider may:
- Work at one location.
- Work at multiple locations.
- Be associated with a Dissafyt-operated business.
- Be an independent or affiliated provider.

A provider has their own profile and availability schedule.

### Location
A location represents a physical place where services can be performed.
A location can have:
- Address and location information.
- Operating hours.
- Associated providers.
- Available services.
- Capacity information.
- Booking rules.

Dissafyt must not assume that one provider equals one location or that one location equals one provider.

### Service
A service defines what the customer books:
- Haircut
- Beard Sculpting
- Consultation
- Grooming Packages
- Monthly Recurring Membership Tiers

A service has name, description, duration in minutes, price, provider availability, and location availability.

---

## Booking Model

A booking connects the relevant entities:

```text
Customer → Service → Provider → Location → Time Slot
```

The system authoritatively validates:
- Provider availability
- Location operating hours
- Service duration
- Anti-collision / double-booking conflicts
- Booking status lifecycle
- Cancellation and reschedule rules

---

## Scaling Model

### Stage 1 — Single Operation
Dissafyt begins with one physical barbershop or one service operation (Ace of Fyt Grooming).
The purpose is to validate customer demand, pricing, service workflows, booking behaviour, and provider workflows.

### Stage 2 — Multiple Providers (Active in Platform)
Additional barbers operate through the same platform.
The platform handles individual provider profiles, provider schedules, provider services, customer bookings, and provider performance metrics.

### Stage 3 — Multiple Locations
The same platform supports multiple physical locations.
Customers select Location $\rightarrow$ Service $\rightarrow$ Provider $\rightarrow$ Available Time.

### Stage 4 — Provider Network
The platform supports independent or affiliated providers who already operate their own physical spaces.
Dissafyt provides digital presence, booking infrastructure, customer management, payments, notifications, customer acquisition, and administrative tooling.

---

## Platform Economics

The module does not assume that the founder personally performs every service.
Potential commercial models include:
- Dissafyt-operated flagship services.
- Provider revenue sharing.
- Commission per booking.
- Platform/service fees.
- Subscription fees for providers.
- Hybrid retail/grooming packages.

---

## Customer-Provider Relationship

A customer may have a preferred provider without being permanently tied to that provider.
The platform supports:
- Preferred providers.
- Previous providers.
- Booking history.
- Provider discovery.
- Provider availability.

---

## Future Possibilities

- Provider onboarding & self-service dashboards
- Automated WhatsApp/SMS reminders
- Waitlists
- Reviews and barber ratings
- Loyalty programmes
- Multi-location executive reporting
