# DISSafyt Development Journal

This document is the template for recording the actual development process.

The journal should document reasoning, decisions, problems and lessons rather than every generated line of code.

---

## Entry Template

### Date

YYYY-MM-DD

### Phase

Example: Phase 2 — Identity

### Objective

What am I trying to accomplish?

### Problem

What problem am I solving?

### Options considered

What approaches were considered?

### Decision

What did I choose?

### Why

Why did I choose it?

### Implementation

What was actually built?

### Files/components affected

List important files or systems.

### Testing

What was tested?

```text
Test:
Expected:
Actual:
Result:
```

### Problems encountered

What broke or behaved unexpectedly?

### Resolution

How was it fixed?

### Lessons learned

What do I understand now that I did not understand before?

### Follow-up

What needs to happen next?

---

## Example Entry

### Date

2026-09-08

### Phase

Phase 1 — Infrastructure

### Objective

Establish the initial platform architecture.

### Problem

DISSafyt needs multiple applications to share one customer identity and database.

### Decision

Use a shared PostgreSQL database and managed authentication, with an API boundary between applications and business data.

### Why

This separates presentation from business logic and prevents each frontend from becoming its own isolated system.

### Result

Architecture documented. Implementation begins with infrastructure and identity rather than UI.

### Lesson

DISSafyt is a platform with multiple interfaces, not simply a website.

---

## Journal Rule

Record important decisions when they happen.

Do not attempt to reconstruct the entire development history months later.

---

## Entry: Phase 2 — Identity & Milestone 1 Gate

### Date
2026-09-08

### Phase
Phase 2 — Identity

### Objective
Verify that user registration, login, automatic profile creation, role assignment, and security boundaries work against live Supabase Auth and PostgreSQL.

### Problem
Ensure the fundamental platform rule: "A user can register, log in, be identified by the API, and manage their own profile" before building domain modules (commerce and barbershop).

### Decision
Applied database migration `0001_initial_schema.sql` to Supabase PostgreSQL, configured `SUPABASE_SERVICE_ROLE_KEY`, and created a rigorous end-to-end test suite (`verify-phase2.mjs`).

### Implementation
- `0001_initial_schema.sql` created `profiles`, `roles`, `user_roles`, commerce tables, service tables, and payments.
- Database trigger `on_auth_user_created` automatically provisions a profile and assigns the `customer` role on user signup.
- Row Level Security (RLS) policies and security functions (`is_admin`) restrict profile access to resource owners and administrators.
- Implemented `GET /api/users/me` and `PATCH /api/users/me` utilizing `@dissafyt/api`.

### Testing
- **Roles & Tables:** Verified all 9 tables exist and 4 roles (`customer`, `barber`, `staff`, `admin`) are present.
- **Registration & Trigger:** Registered a customer; verified automated profile creation and default role assignment.
- **Authentication:** Verified password login and JWT access token acquisition.
- **Profile Update:** Verified profile modifications (`full_name`, `phone`).
- **Security Matrix:**
  - Owner reading own profile: ALLOW (200 OK)
  - User reading another profile: DENY (RLS enforced, 0 rows)
  - Non-admin checking `is_admin`: DENY (`false`)

### Lessons learned
Automating profile provisioning via PostgreSQL triggers on `auth.users` prevents race conditions between auth and application data, ensuring an ironclad customer identity layer.

---

## Entry: Phase 5 — Admin Application Operations

### Date
2026-09-08

### Phase
Phase 5 — Admin Application

### Objective
Provide full operational back-office capabilities in `apps/admin`: manage commerce products with PayFast buy buttons, manage barbershop services & recurring subscriptions, and manage platform customer roles.

### Problem
Platform administrators need operational control over the product catalog and barbershop services without touching the database manually, while ensuring live sync to public customer storefronts.

### Decision
- Built decoupled service classes in `@dissafyt/api`: `AdminProductService`, `AdminBarbershopService`, and `AdminUserService`.
- Exposed RESTful Next.js Route Handlers in `apps/admin/app/api/...` for products, categories, services, users, and admin bootstrapping.
- Added `PayfastProductButton` to `@dissafyt/ui` so products feature live South African PayFast checkout.
- Connected customer pages (`/shop` and `/book`) dynamically to database APIs.

### Implementation
- `apps/admin/app/commerce/page.tsx`: Product table, Add Product modal with category selection and variant stock, status toggle, delete.
- `apps/admin/app/barbershop/page.tsx`: Barbershop services table, Add Service/Membership modal with recurring subscription parameters, status toggle, delete.
- `apps/admin/app/customers/page.tsx`: Customer directory with role management (`admin`, `barber`, `staff`).
- `apps/admin/app/settings/page.tsx`: System settings and "Bootstrap First Admin" utility.

### Testing
- Executed `verify-admin.mjs`: verified category creation, product creation, variant association, barbershop service creation, and cleanup.
- Ran full Turborepo build (`pnpm build`): both apps compiled cleanly with 0 type errors.

