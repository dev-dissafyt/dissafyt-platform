# Dissafyt Platform Blueprint

## 1. Executive Summary

Dissafyt is a unified digital business platform intended to support multiple products and services through a common technical and customer infrastructure.

The platform begins with two primary business experiences:

1. A clothing/e-commerce experience
2. A barbershop/service-booking experience

The platform is intentionally designed so these experiences do not become isolated applications with separate customers, accounts, databases and administration systems.

Instead, Dissafyt has a shared platform core:

- One customer identity
- One authentication system
- One PostgreSQL data layer
- One backend/API boundary
- Shared customer profiles
- Shared roles and permissions
- Shared payment infrastructure where appropriate
- Shared notification infrastructure
- A central administration application

The long-term objective is to allow new Dissafyt products, services and applications to be added without rebuilding identity, customer management and core infrastructure.

---

## 2. What Dissafyt Is

Dissafyt is not simply:

- an online clothing store
- a barber booking website
- an admin dashboard
- a collection of unrelated pages

It is a platform.

The website, mobile application, admin dashboard and future interfaces are clients of the platform.

```text
                     Dissafyt Platform Core
                              |
          +-------------------+-------------------+
          |                   |                   |
      Customer Web         Admin Web          Future Apps
          |                   |                   |
          +-------------------+-------------------+
                              |
                         API / Backend
                              |
                 +------------+------------+
                 |                         |
          Authentication              PostgreSQL
                 |                         |
                 +------------+------------+
                              |
                       Business Modules
                 +------------+------------+
                 |                         |
             Clothing                 Barbershop
```

---

## 3. Product Vision

A customer should have a single Dissafyt account.

That account should allow the customer to interact with multiple Dissafyt experiences without creating separate identities.

For example:

```text
                 Dissafyt Account
                       |
          +------------+------------+
          |            |            |
       Clothing    Barbershop   Future Service
          |            |            |
        Orders      Bookings     Activity
```

A customer should be able to:

- register once
- maintain one profile
- purchase products
- book services
- view their activity
- manage account information
- receive notifications
- use future Dissafyt applications with the same identity

---

## 4. Platform Users

Initial user categories:

### Customer

The normal consumer of Dissafyt products and services.

### Barber

A service provider who may manage availability and bookings.

### Staff

An authorized operational user with limited administrative capabilities.

### Admin

A privileged user who manages the platform and its business modules.

Future roles may include:

- manager
- accountant
- support agent
- vendor
- partner
- content editor

Roles should be permission-based rather than hard-coded throughout the applications.

---

## 5. Applications

### 5.1 Customer application

The customer application is the public-facing Dissafyt experience.

Potential routes:

```text
/
 /shop
 /shop/products
 /shop/products/:id
 /services
 /book
 /login
 /register
 /account
 /account/profile
 /account/orders
 /account/bookings
 /account/subscriptions
```

The exact route structure can change.

The customer application should primarily:

- present information
- collect user input
- call the API
- display API results
- manage client-side interaction
- initiate authentication flows

It should not be the source of truth for business rules.

---

### 5.2 Admin application

The admin application is a separate application/interface.

Potential areas:

```text
Dashboard
Customers
Products
Inventory
Orders
Services
Bookings
Staff
Subscriptions
Payments
Notifications
Content
Reports
Settings
```

The admin app should use the same authentication system as the customer application.

Administrative permissions must be enforced by the backend.

---

### 5.3 Future mobile application

A mobile application should be able to consume the same API and authentication infrastructure.

The platform should therefore not assume that a browser is the only client.

---

## 6. Platform Core

The platform core contains capabilities shared across modules and applications.

### Identity

- user identity
- authentication
- sessions
- account lifecycle

### Profiles

- customer information
- contact details
- preferences
- addresses where required

### Authorization

- roles
- permissions
- resource ownership

### API

- validation
- business rules
- database operations
- integrations

### Infrastructure

- environments
- deployment
- monitoring
- secrets
- backups

---

## 7. Customer Identity Model

The key principle is:

> There is one Dissafyt customer identity, not one account per module.

Example:

```text
User
 |
 +-- Profile
 |
 +-- Orders
 |     +-- Order Items
 |           +-- Products
 |
 +-- Bookings
 |     +-- Services
 |     +-- Barber
 |
 +-- Payments
 |
 +-- Subscriptions
```

The same user ID should connect these records.

---

## 8. Authentication

The current direction is to use Supabase Auth with Supabase PostgreSQL.

Supabase handles the identity/authentication infrastructure.

Dissafyt's API remains responsible for platform-specific authorization and business logic.

Conceptually:

```text
Application
    |
    v
Authentication
    |
    v
Authenticated user
    |
    v
Dissafyt API
    |
    +-- authorization
    +-- validation
    +-- business logic
    |
    v
PostgreSQL
```

The platform should not implement custom password security when a suitable managed authentication service can provide it.

---

## 9. User Profile

Authentication identity and application profile are separate concerns.

Authentication identity answers:

> Who is this account?

The Dissafyt profile answers:

> What information does Dissafyt need about this customer?

The profile may include:

- name
- phone
- profile image
- addresses
- preferences
- customer-specific information

Sensitive information should only be collected when there is a real business requirement.

---

## 10. Business Modules

### Clothing

The clothing module handles commerce.

Primary concepts:

- products
- categories
- variants
- inventory
- cart
- checkout
- orders
- payments
- fulfillment

See `04-modules/CLOTHING.md`.

### Barbershop

The barbershop module handles services and appointments.

Primary concepts:

- services
- staff
- availability
- bookings
- appointments
- customer history
- service pricing

See `04-modules/BARBERSHOP.md`.

### Payments

Payment processing is a shared platform capability used by modules that require payment.

See `04-modules/PAYMENTS.md`.

### Notifications

Notifications provide shared communication infrastructure.

See `04-modules/NOTIFICATIONS.md`.

---

## 11. Unified Customer Experience

A customer should not have to understand the internal module structure.

The experience should feel like one platform.

For example:

```text
Customer logs in
       |
       v
Dissafyt Account
       |
       +---- Shop
       |
       +---- Book a haircut
       |
       +---- View orders
       |
       +---- View bookings
       |
       +---- Edit profile
```

The backend can distinguish the modules while the customer experiences a unified account.

---

## 12. Admin Experience

The admin application should provide a unified operational view.

For example:

```text
Dissafyt Admin
 |
 +-- Customers
 |
 +-- Commerce
 |     +-- Products
 |     +-- Orders
 |     +-- Inventory
 |
 +-- Barbershop
 |     +-- Services
 |     +-- Staff
 |     +-- Bookings
 |
 +-- Payments
 |
 +-- Notifications
 |
 +-- Settings
```

The admin should not need to operate separate systems for every module unless a future business requirement makes that necessary.

---

## 13. API as Platform Boundary

The API should sit between applications and core data/business logic.

```text
Customer App
      |
      v
     API
      |
      v
Business Logic
      |
      v
PostgreSQL
```

The same applies to the admin application.

The browser should not be given unrestricted direct access to the database.

---

## 14. API Responsibilities

The API should:

1. authenticate requests
2. identify the user
3. authorize the requested action
4. validate input
5. execute business rules
6. read/write data
7. call external services where necessary
8. return a predictable response

General request lifecycle:

```text
Request
  |
Authentication
  |
Authorization
  |
Validation
  |
Business Rules
  |
Database / External Service
  |
Response
```

---

## 15. Data Ownership

Each major piece of data should have a clear owner.

Examples:

- Auth identity → authentication system
- Customer profile → Dissafyt database
- Product → commerce module
- Order → commerce module
- Booking → barbershop module
- Payment record → payment subsystem
- Notification event → notification subsystem

Modules may reference each other's data but should not casually duplicate it.

---

## 16. Payments

The initial payment direction is PayFast.

Payment processing should be handled through the backend.

The client should not be trusted to declare that a payment succeeded.

General flow:

```text
Customer
  |
Checkout
  |
Payment provider
  |
Provider confirmation/webhook
  |
Dissafyt API
  |
Verify payment
  |
Update payment/order state
```

---

## 17. Notifications

Notifications may eventually include:

- email
- WhatsApp
- SMS
- in-app notifications

Examples:

```text
Order confirmed
Booking confirmed
Booking changed
Payment received
Order shipped
Appointment reminder
```

Notifications should be generated from validated platform events.

---

## 18. Security Principles

The platform should follow these principles:

- frontend permissions are never trusted
- API inputs are validated
- users can only access resources they are authorized to access
- secrets remain server-side
- payment events are verified
- production credentials are separated from development credentials
- authentication is delegated to a mature provider
- database access is restricted
- logs should avoid unnecessary sensitive information
- administrative operations should be auditable

---

## 19. Scalability Philosophy

The initial platform should be simple.

Do not prematurely introduce:

- microservices
- Kubernetes
- event buses
- complex caching infrastructure
- multiple databases
- distributed systems

Start with a modular application and a clean API boundary.

Extract services only when actual scale or operational requirements justify it.

---

## 20. Long-Term Direction

The architecture should allow:

```text
                    Dissafyt Core
                         |
       +-----------------+-----------------+
       |                 |                 |
      Web              Admin            Mobile
       |                 |                 |
       +-----------------+-----------------+
                         |
                        API
                         |
               +---------+---------+
               |                   |
             Auth             PostgreSQL
               |                   |
               +---------+---------+
                         |
             +-----------+-----------+
             |                       |
          Commerce              Barbershop
```

The platform can eventually support additional Dissafyt businesses without rebuilding its identity infrastructure.

---

## 21. Definition of Success

The platform foundation is successful when:

- one user can register
- the user can log in
- the platform can identify the authenticated user
- the user can manage their profile
- roles can be assigned
- unauthorized requests are rejected
- the customer application can consume the API
- the admin application can consume the API
- both applications use the same user identity
- business modules can reference the same customer
- orders and bookings can be connected to that customer
- payment events can be securely recorded
