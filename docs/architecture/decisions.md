# Dissafyt Architecture Decisions

This document summarizes the core architectural decisions of the Dissafyt Platform.
For the complete, timestamped Architecture Decision Log, see [06-build/DECISIONS.md](file:///Users/cl/Desktop/dissafyt-platform/docs/06-build/DECISIONS.md).

---

## Decision 001 — Separate Frontend Applications
Dissafyt uses separate customer-facing (`apps/customer` on port 3000) and administrative (`apps/admin` on port 3001) applications.
- **Reason:** Different responsibilities, workflows, and security postures. Admin functionality is never exposed in the customer bundle.

---

## Decision 002 — Dedicated Backend API Boundary
Business logic is centralized in `@dissafyt/api`, with an established architectural path for independent container deployment at `api.dissafyt.com`.
- **Reason:** Centralizes validation, availability calculations, collision prevention, and PayFast signature verification. Neither frontend application independently manipulates database rules.

---

## Decision 003 — Shared Identity & Managed Authentication
The customer application and admin application share the same authentication infrastructure via Supabase Auth.
- **Reason:** One platform identity across clothing and barbershop domains. Database Row Level Security (RLS) and RBAC role tables determine access permissions.

---

## Decision 004 — PostgreSQL Database
PostgreSQL is the primary relational database storing Dissafyt application data.
- **Reason:** Strong relational integrity, foreign key constraints, atomic transactions, and support for complex scheduling and inventory joins.

---

## Decision 005 — Barbershop is a Network-Capable Module
The Barbershop module must not be architected around a single shop or single barber.
- **Reason:** Physical premises create a scaling ceiling. Providers and locations need to be independently represented so the same digital infrastructure supports multiple barbers, multiple branches, and future affiliated provider networks.

---

## Decision 006 — Start Simple
Do not begin with microservices or distributed infrastructure.
- **Reason:** Validate business workflows and customer transactions on a clean monorepo before introducing unnecessary operational complexity.

---

## Decision 007 — Documentation Follows the Business Model
Database and API design follow confirmed business requirements. We do not design arbitrary database tables first and force the business to fit the database.
