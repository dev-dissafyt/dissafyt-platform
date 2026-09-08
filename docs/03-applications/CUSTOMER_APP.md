# Dissafyt Customer Application

## Purpose

The customer application is the public-facing interface to the Dissafyt platform.

## Responsibilities

- public content
- product discovery
- service discovery
- authentication UI
- customer profile UI
- cart/checkout UI
- booking UI
- order/booking history
- communication of API results

## Example information architecture

```text
Home
 |
 +-- Shop
 |    +-- Categories
 |    +-- Product
 |    +-- Cart
 |    +-- Checkout
 |
 +-- Services
 |    +-- Services
 |    +-- Booking
 |
 +-- Account
      +-- Profile
      +-- Orders
      +-- Bookings
      +-- Subscriptions
```

## Authentication

The app should use the shared Dissafyt authentication system.

It must not create a second customer account system.

## API interaction

The application communicates with the API for protected business operations.

Examples:

```text
GET /products
GET /users/me
GET /orders
GET /bookings
POST /bookings
```

## UX principle

The customer should experience one coherent Dissafyt account even when interacting with different modules.

## State

Client-side state should not replace the database as the source of truth.

Important state such as order status and booking status should be retrieved from the backend.
