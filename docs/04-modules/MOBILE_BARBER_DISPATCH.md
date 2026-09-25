# Mobile Barber on the Go (Uber / Bolt Dispatch Architecture)

## Overview
An on-demand and scheduled mobile barbering service allowing clients to book house calls, hotel visits (e.g. V&A Waterfront), or private executive appointments, with integrated passenger ride dispatch via corporate ride-hailing APIs (Uber for Business / Bolt Business API), paid upfront by the client during checkout.

---

## 1. Core Mechanics & Billing Reality

### The "Two-Way Transit" Principle
A mobile barber does not simply travel to a client; they carry a professional toolkit (cordless clippers, sanitization gear, ring light, cape, neck strips, mirror) and must return to the studio or travel to their next client.
$$\text{Total Travel Fee} = (\text{Estimated Transit to Client} + \text{Estimated Transit Return}) + \text{Mobile Kit Premium}$$

### Billing & Gateway Flow
- **Payment Method**: South African PayFast (ZAR instant EFT / Debit / Credit / Capitec Pay).
- **Billing Relationship**:
  - The client pays **Dissafyt** upfront for the service + travel surcharge.
  - Dissafyt automatically pays **Uber for Business / Bolt Business** via the corporate profile credit card upon dispatch.
  - Dissafyt retains a margin buffer or absorbs minor peak dynamic surges.

---

## 2. Pricing Models

| Model | Mechanics | Recommendation |
| :--- | :--- | :--- |
| **Zone-Based Flat Surcharge** | Fixed travel fee based on predefined distance zones:<br>• **Zone 1** (City Bowl / Atlantic Seaboard): `+R180`<br>• **Zone 2** (Southern Suburbs / Milnerton): `+R300`<br>• **Zone 3** (Constantia / Blouberg / Northern Suburbs): `+R450` | **Recommended for v1**: Predictable for clients, zero checkout friction, no advance surge calculation surprises. |
| **Real-Time API Quoting + Buffer** | Live call to Uber API `GET /v1/estimates/price` at checkout + 15% surge buffer + 2x multiplier (return leg). | Best for on-demand bookings made within 1 hour of dispatch. |
| **Post-Service Reconciliation** | Re-billing stored card after trip completion. | Not recommended due to South African 3D Secure / OTP re-billing constraints. |

---

## 3. Technical Architecture

### A. Database Additions (`public.bookings`)
```sql
ALTER TABLE public.bookings
ADD COLUMN service_mode TEXT DEFAULT 'in_store' CHECK (service_mode IN ('in_store', 'mobile_house_call')),
ADD COLUMN client_address TEXT,
ADD COLUMN client_lat NUMERIC,
ADD COLUMN client_lng NUMERIC,
ADD COLUMN travel_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN transit_provider TEXT DEFAULT 'uber' CHECK (transit_provider IN ('uber', 'bolt', 'own_transport')),
ADD COLUMN transit_ride_id TEXT,
ADD COLUMN transit_status TEXT DEFAULT 'idle' CHECK (transit_status IN ('idle', 'dispatch_pending', 'driver_assigned', 'in_transit', 'arrived', 'completed')),
ADD COLUMN transit_tracking_url TEXT;
```

### B. Dispatch Sequence
```
Client Booking (Web / WhatsApp)
  │
  ├── Selects "Mobile House Call" & inputs address
  ├── System calculates Travel Surcharge (Zone 1/2/3)
  └── Client completes PayFast ZAR checkout
        │
        ▼ (T - 35 mins before appointment)
Admin / Barber triggers Dispatch ("Dispatch Ride")
  │
  ├── Backend calls Uber for Business Guest Rides API
  ├── Uber assigns driver (comfort/sedan recommended for kit capacity)
  ├── System receives live tracking URL (`m.uber.com/looking/...`)
  └── Automated WhatsApp message sent to Client & Barber with live tracking link
```

---

## 4. Operational Requirements & Guardrails

1. **Kit Specifications**: Mobile barbers require an Uber Comfort / sedan category to ensure space for heavy kit (cordless clippers, UV sanitizers, extension leads, portable ring light).
2. **Buffer Calendaring**: A mobile appointment blocks **90–120 minutes** on the barber's booking schedule (setup, fade, hair cleanup, pack-down, return travel) rather than standard 45 minutes in-store.
3. **Client Prerequisites**: Booking agreement prompts client to provide a standard 220V power point and clean, well-lit surface.
