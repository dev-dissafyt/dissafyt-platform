# DISSafyt Admin Application

## Purpose

The admin application provides operational control over DISSafyt.

## Authentication

The admin uses the same identity system as every other DISSafyt user.

The difference is authorization.

```text
Same identity
     |
     v
Role/permissions
     |
 +---+---+
 |       |
Customer Admin
```

## Core sections

### Dashboard

- platform overview
- orders
- bookings
- customers
- operational alerts

### Customers

- search
- view customer
- permitted profile information
- customer activity

### Commerce

- products
- categories
- variants
- inventory
- orders

### Barbershop

- services
- staff
- availability
- bookings

### Payments

- payment records
- transaction status
- payment exceptions

### Settings

- platform configuration
- staff permissions
- module settings

## Security

The admin app must never assume that a user is an administrator merely because the frontend displays an admin screen.

Every protected operation must be checked by the API.

## Data access

Do not expose unrestricted database credentials to the browser.
