# Dissafyt Authorization Model

## Authentication vs authorization

Authentication:

> Who are you?

Authorization:

> What are you allowed to do?

## Initial roles

### customer

Can:

- manage own profile
- view own orders
- create/view own bookings
- perform permitted purchases

Cannot:

- manage products
- manage other users
- administer bookings globally

### barber

Can:

- view assigned service information
- view permitted bookings
- manage permitted availability
- update permitted appointment states

### staff

Can:

- access explicitly granted operational functions

### admin

Can:

- manage platform resources according to administrator permissions

## Permission model

Prefer explicit permissions behind roles.

Examples:

```text
users.read
users.update
users.manage

products.read
products.create
products.update
products.delete

orders.read
orders.manage

bookings.read
bookings.manage

staff.manage
```

## Resource ownership

A customer requesting:

```text
GET /orders/123
```

must only receive the order if they are authorized to access order 123.

Do not rely on the frontend hiding the order.

## Admin authorization

Admin interfaces should hide unavailable controls for usability, but the API must independently enforce the same permission.

## Authorization test matrix

```text
Customer -> own profile       ALLOW
Customer -> another profile   DENY
Customer -> own order         ALLOW
Customer -> another order     DENY
Customer -> admin endpoint    DENY
Admin -> permitted admin      ALLOW
```
