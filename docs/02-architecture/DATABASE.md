# DISSafyt Database Architecture

## Database technology

PostgreSQL, managed through the selected Supabase environment.

## Core identity

Authentication identity is managed by the authentication system.

DISSafyt-specific records reference the authenticated user's ID.

Conceptual structure:

```text
auth identity
     |
     v
profiles
     |
     +-- orders
     +-- bookings
     +-- subscriptions
     +-- addresses
```

## Initial entities

### Identity/profile

- users/auth identity
- profiles
- roles
- user_roles

### Commerce

- products
- product_variants
- categories
- product_categories
- inventory
- carts
- cart_items
- orders
- order_items

### Services

- services
- staff
- staff_services
- availability
- bookings

### Payments

- payments
- payment_events

### Notifications

- notifications
- notification_events

## Relationship principles

Orders belong to customers.

Bookings belong to customers.

Order items reference products/variants.

Bookings reference services and, where applicable, staff.

Payments reference the business transaction they settle.

## Data integrity

Use PostgreSQL constraints for important invariants where practical.

Examples:

- unique email/identity constraints are handled by auth
- unique SKU
- valid foreign keys
- non-negative inventory
- valid order totals
- valid booking relationships

## Schema evolution

The schema should evolve through migrations.

Do not manually make undocumented production database changes.

## Data access

Frontend clients should not receive unrestricted database credentials.

Access should be controlled through the backend and/or tightly scoped platform policies where direct client access is intentionally used.
