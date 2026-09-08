# Dissafyt Barbershop Module

## 1. Purpose

The Barbershop module provides the digital infrastructure for booking and managing barbering and grooming services.

It is designed to scale beyond a single physical shop by supporting multiple service providers and multiple locations through shared platform infrastructure.

The module represents Ace of Fyt Grooming and can expand to support affiliated service brands.

---

## 2. Core Entities

The business model clearly separates:

- **Customer**
- **Service provider (Staff/Barber)**
- **Location**
- **Service**
- **Availability**
- **Booking**

These entities must not be treated as interchangeable. Dissafyt must not assume that one provider equals one location or that one location equals one provider.

```text
Customer
  |
  +---> Service
          |
          +---> Provider (Barber)
                  |
                  +---> Location
                          |
                          +---> Time Slot (Availability)
                                  |
                                  +---> Booking (Status, Payment)
```

### Customer
A customer has a platform-level Dissafyt account and can interact with the Barbershop module.
- Name and contact information
- Unified booking history
- Service history & preferences
- Relevant notes & waybill details

### Service Provider (Barber / Staff)
A service provider is a grooming specialist who provides barbering or related services.
- Linked user ID & profile
- Display name & biography
- Role (`barber`, `staff`)
- Associated locations (single or multi-location)
- Service competencies & duration overrides
- Individual availability schedules

### Location
A physical establishment where grooming services are performed.
- Address & city information
- Operating hours (e.g. Mon-Fri 09:00-18:00, Sat 09:00-17:00, Sun closed)
- Associated providers & assigned chairs
- Available services & capacity rules

### Service
Defines what the customer books (e.g. The Full Combo, Signature Haircut, Beard Sculpting, VIP Subscriptions).
- Name, description, base price
- Duration in minutes
- Active status
- Provider availability & location availability
- Subscription parameters (plan code, billing frequency, recurring cycles)

### Availability
Authoritatively calculated by the backend API (`BarbershopService` / `AvailabilityEngine`):
- Operating hours per location
- Staff working hours & breaks
- Service duration requirements
- Existing confirmed bookings (anti-double-booking collision detection)

### Booking
A confirmed reservation binding customer, service, provider, location, and time slot.
- Initial status model: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`.
- Immutable audit log & payment link (`public.payments`).

---

## 3. Booking Flow

```text
Customer
  |
Choose Service (Regular haircut or Monthly Subscription)
  |
Choose Master Barber (or "Any Barber")
  |
Choose Date
  |
Retrieve Live 30-min Available Slots (Dynamic API check)
  |
Choose Slot
  |
Review & Notes
  |
Confirm / PayFast Checkout
  |
Instant Confirmation & Account Sync
```

---

## 4. Scaling Model

### Stage 1 — Single Operation (Validated MVP)
Dissafyt begins with one physical service operation (Ace of Fyt Grooming).
- Validates customer demand, pricing, 30-min service duration workflows.
- Validates booking and no-show behaviour.

### Stage 2 — Multiple Providers (Implemented & Active)
Additional barbers operate concurrently through the same platform.
- Individual provider profiles and active states (`Ace`, `Marcus`).
- Provider schedules and chair conflict prevention.
- Provider performance metrics (completed cuts, upcoming appointments).

### Stage 3 — Multiple Locations (Architectural Target)
The platform expands to support multiple physical branches.
- Physical `locations` entity enabled in database.
- Customers select location, service, barber, and slot.
- Location-specific operating hours and capacity.

### Stage 4 — Provider & Salon Network (Strategic Horizon)
The platform scales to support independent or affiliated barbers and shops operating their own spaces.
- Digital booking infrastructure and unified customer management provided by Dissafyt.
- Payments, SMS notifications, and automated recurring memberships.
- Provider self-service portals and administrative analytics.

---

## 5. Platform Economics & Commercials

The module is designed so that revenue does not depend exclusively on the founder personally performing every service.

Potential commercial models include:
- Dissafyt-operated direct services.
- Provider revenue sharing & split commissions.
- Fixed platform fees per booking.
- Monthly recurring subscription tiers (Silver, Gold, VIP Club).
- Hybrid retail/service packages (haircut + streetwear bundle).

---

## 6. Customer & Staff Capabilities

### Customer Capabilities
- Browse services and membership tiers.
- View real-time availability without stale caching.
- Create bookings and subscribe with PayFast recurring billing.
- View upcoming and past appointments under a unified account.
- Self-service reschedule and cancellation within cancellation cutoff windows.
- Configure notification preferences (SMS/WhatsApp reminders).

### Staff Capabilities
- View assigned upcoming appointment board.
- Update booking status (`Confirm`, `Complete`, `No-Show`).
- View customer Waybill/notes and service requirements.

### Admin Capabilities
- Real-time schedule calendar with date filters (`upcoming`, `today`, `all`).
- Staff management (create, update, toggle active status).
- Service catalog and monthly subscription plan configuration.
- Operational reporting (gross grooming volume, cuts per barber).

---

## 7. Business Rules (Enforced at Backend API Boundary)

1. **Authoritative Slot Calculation**: Slot availability is strictly computed on the backend (`@dissafyt/api`), never trusted from the client.
2. **Anti-Collision Guard**: Overlapping time slots for the same barber cannot be double-booked.
3. **Shop Hours Enforcement**: Bookings cannot start or end outside operational hours; Sunday bookings are rejected.
4. **Reschedule Integrity**: Rescheduling an appointment verifies target slot availability and updates timestamps atomically.
5. **Decoupled Identity**: Customers use their platform profile; barbers use linked staff records.
