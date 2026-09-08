# Dissafyt Product Scope

## In scope

### Foundation

- centralized identity
- authentication
- customer profiles
- roles
- permissions
- API
- PostgreSQL
- administration

### Commerce

- clothing catalog
- products
- variants
- inventory
- cart
- orders
- payments
- fulfillment status

### Barbershop

- services
- staff
- schedules
- availability
- bookings
- appointments
- customer booking history

### Platform

- notifications
- account management
- shared customer activity
- administration
- reporting where justified

## Initially out of scope

These may become future features but should not block the first usable version:

- native mobile application
- advanced loyalty platform
- AI assistants
- complex recommendation engines
- microservice decomposition
- advanced event streaming
- multi-region infrastructure
- sophisticated analytics warehouse

## MVP principle

The first release should prove the platform architecture rather than attempt to implement every future idea.

A useful first release should demonstrate:

```text
Account
  |
Profile
  |
Shop + Booking
  |
Order + Appointment
  |
Admin
```
