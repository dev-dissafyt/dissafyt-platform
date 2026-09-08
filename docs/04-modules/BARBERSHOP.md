# DISSafyt Barbershop Module

## 1. Purpose

The barbershop module provides appointment-based services through the shared DISSafyt identity and API.

The module may represent Ace of Fyt or another DISSafyt service brand.

## 2. Core entities

```text
Customer
  |
Booking
  |
+-- Service
+-- Staff/Barber
+-- Date/time
+-- Status
+-- Payment where applicable
```

## 3. Services

A service should support:

- name
- description
- price
- duration
- active status
- optional staff restrictions

Examples may include:

- haircut
- consultation
- combined service
- future packages

## 4. Staff

Staff records may include:

- linked user ID
- display name
- role
- active status
- services provided
- scheduling information

## 5. Availability

Availability should account for:

- staff working hours
- unavailable periods
- existing bookings
- service duration
- booking rules

The backend must calculate authoritative availability.

## 6. Booking flow

```text
Customer
  |
Choose service
  |
Choose staff (optional)
  |
Choose date
  |
Retrieve available times
  |
Choose time
  |
Review
  |
Confirm
  |
Create booking
  |
Confirmation
```

## 7. Booking states

Initial model:

```text
pending
confirmed
completed
cancelled
no_show
```

Exact transitions must be defined before production.

## 8. Customer capabilities

- browse services
- view pricing
- view availability
- create booking
- view bookings
- cancel/reschedule where permitted
- receive confirmations/reminders

## 9. Staff capabilities

Subject to permissions:

- view assigned bookings
- manage permitted availability
- update permitted booking states

## 10. Admin capabilities

- manage services
- manage staff
- manage schedules
- view bookings
- modify bookings
- manage pricing
- view customer booking history

## 11. Consultation extension

A future consultation system may attach structured consultation records to a customer and/or booking.

This should be designed separately rather than mixing consultation data into the basic booking table.

## 12. Business rules

Examples:

- prevent double-booking
- respect service duration
- prevent bookings in unavailable periods
- enforce cancellation rules
- enforce staff/service compatibility

These rules belong in the backend.
