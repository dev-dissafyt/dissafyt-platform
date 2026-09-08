# DISSafyt Build Plan

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

- [ ] Define roles
- [ ] Define permissions
- [ ] Implement backend authorization
- [ ] Protect customer resources
- [ ] Protect admin resources
- [ ] Test ownership
- [ ] Test customer vs admin access

Exit condition:

The backend—not the frontend—controls access.

---

# Phase 4 — Customer Application

- [ ] Create Next.js customer app
- [ ] Connect authentication
- [ ] Create public navigation
- [ ] Create login/register UI
- [ ] Create account area
- [ ] Create profile editing
- [ ] Connect `/users/me`
- [ ] Handle loading/error states

Exit condition:

A real customer can use the platform through the web interface.

---

# Phase 5 — Admin Application

- [ ] Create separate admin app
- [ ] Connect shared authentication
- [ ] Implement admin authorization
- [ ] Create dashboard
- [ ] Customer management
- [ ] Basic settings

Exit condition:

An authorized administrator can operate the platform through a separate application.

---

# Phase 6 — Clothing MVP

- [ ] Categories
- [ ] Products
- [ ] Variants
- [ ] Inventory
- [ ] Product browsing
- [ ] Product detail
- [ ] Cart
- [ ] Checkout
- [ ] Orders
- [ ] Payment integration
- [ ] Admin product management
- [ ] Admin order management

Exit condition:

A customer can purchase a product and the admin can manage the resulting order.

---

# Phase 7 — Barbershop MVP

- [ ] Services
- [ ] Staff
- [ ] Staff/service relationships
- [ ] Availability
- [ ] Booking creation
- [ ] Booking validation
- [ ] Booking management
- [ ] Customer booking history
- [ ] Admin booking management
- [ ] Staff booking access
- [ ] Notifications

Exit condition:

A customer can book a service and authorized staff can manage it.

---

# Phase 8 — Platform Integration

- [ ] Unified customer dashboard
- [ ] Orders + bookings visible under one account
- [ ] Notification preferences
- [ ] Shared payment records
- [ ] Audit-sensitive operations
- [ ] Operational reporting

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
- additional DISSafyt businesses
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
