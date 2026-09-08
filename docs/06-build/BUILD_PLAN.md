# Dissafyt Build Plan

## Rule

**Do not build the entire platform at once.**

Build one verified layer at a time.

---

# Phase 0 — Documentation

- [x] Master platform concept
- [x] Product scope
- [x] Architecture
- [x] Database concept
- [x] Authentication concept
- [x] API concept
- [x] Roles/permissions
- [x] Module specifications

Exit condition:

The architecture is understandable before implementation begins.

---

# Phase 1 — Infrastructure Foundation

- [x] Create source-control repositories/project structure
- [x] Create Supabase project
- [x] Confirm PostgreSQL access
- [x] Configure development environment
- [x] Configure environment variables
- [x] Establish migration workflow
- [x] Establish basic API project structure

Exit condition:

Application can securely communicate with the development database/platform.

---

# Phase 2 — Identity

- [x] Configure Supabase Auth
- [x] Test registration
- [x] Test login
- [x] Test logout
- [x] Test session persistence
- [x] Test invalid/expired session
- [x] Create profile model
- [x] Link profile to user identity
- [x] Assign default customer role
- [x] Implement `GET /users/me`
- [x] Implement profile update
- [x] Test unauthorized access

Exit condition:

A user can register, log in, be identified by the API and manage their own profile.

---

# Phase 3 — Authorization

- [x] Define roles
- [x] Define permissions
- [x] Implement backend authorization
- [x] Protect customer resources
- [x] Protect admin resources
- [x] Test ownership
- [x] Test customer vs admin access

Exit condition:

The backend—not the frontend—controls access. (VERIFIED)

---

# Phase 4 — Customer Application

- [x] Create Next.js customer app
- [x] Connect authentication
- [x] Create public navigation
- [x] Create login/register UI
- [x] Create account area
- [x] Create profile editing
- [x] Connect `/users/me`
- [x] Handle loading/error states

Exit condition:

A real customer can use the platform through the web interface. (VERIFIED)

---

# Phase 5 — Admin Application

- [x] Create separate admin app
- [x] Connect shared authentication
- [x] Implement admin authorization
- [x] Create dashboard
- [x] Customer management
- [x] Basic settings

Exit condition:

An authorized administrator can operate the platform through a separate application.

---

# Phase 6 — Clothing MVP

- [x] Categories
- [x] Products
- [x] Variants
- [x] Inventory
- [x] Product browsing
- [x] Product detail
- [x] Cart
- [x] Checkout
- [x] Orders
- [x] Payment integration
- [x] Admin product management
- [x] Admin order management

Exit condition:

A customer can purchase a product and the admin can manage the resulting order.

---

# Phase 7 — Barbershop MVP

- [x] Services
- [x] Staff
- [x] Staff/service relationships
- [x] Availability
- [x] Booking creation
- [x] Booking validation
- [x] Booking management
- [x] Customer booking history
- [x] Admin booking management
- [x] Staff booking access
- [x] Notifications

Exit condition:

A customer can book a service and authorized staff can manage it. (VERIFIED)

---

# Phase 8 — Platform Integration

- [x] Unified customer dashboard
- [x] Orders + bookings visible under one account
- [x] Notification preferences
- [x] Shared payment records
- [x] Audit-sensitive operations
- [x] Operational reporting

Exit condition:

Commerce and Barbershop operations are unified into a single reporting and customer management engine. (VERIFIED)

---

# Phase 9 — Production

- [ ] Production Supabase environment
- [ ] Production domains
- [ ] API deployment
- [ ] Customer deployment
- [ ] Admin deployment
- [ ] HTTPS
- [ ] Secrets
- [ ] Database backups
- [ ] Error monitoring
- [ ] Payment webhook verification
- [ ] Security review
- [ ] End-to-end tests
- [ ] Launch checklist

---

# Phase 10 — Future

Potential:

- mobile app
- WhatsApp automation
- accounting integration
- advanced subscriptions
- loyalty
- analytics
- additional Dissafyt businesses
- independent API deployment at `api.dissafyt.com`

---

## First milestone

Do not move into products or bookings until this works:

```text
REGISTER
   |
LOGIN
   |
SESSION
   |
GET /users/me
   |
PROFILE
   |
LOGOUT
```

Then verify:

```text
Customer -> own data       ALLOW
Customer -> other data     DENY
Customer -> admin          DENY
Admin -> permitted admin   ALLOW
```
