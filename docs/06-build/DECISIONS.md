# Dissafyt Architecture Decision Record

This is the running decision log.

## Decision 001 — Platform Architecture

**Status:** Accepted

Dissafyt will be designed as a platform with multiple applications sharing a common backend, authentication and PostgreSQL data layer.

**Reason:** Prevent duplicated identity and business logic.

---

## Decision 002 — Database

**Status:** Accepted

Use PostgreSQL as the primary relational database.

**Reason:** Strong relational model, transactions, constraints and mature ecosystem.

---

## Decision 003 — Managed Authentication

**Status:** Proposed / current direction

Use Supabase Auth rather than implementing password/session infrastructure from scratch.

**Reason:** Authentication is security-critical infrastructure and does not provide competitive differentiation for Dissafyt.

---

## Decision 004 — API Boundary

**Status:** Accepted

Applications communicate with the business layer through an API boundary.

**Reason:** Allows customer, admin and future mobile applications to consume the same business capabilities.

---

## Decision 005 — Separate Admin Application

**Status:** Accepted

The admin experience is treated as a separate application/interface from the customer application.

**Reason:** Different users, workflows, information density and authorization requirements.

---

## Decision 006 — Start Simple

**Status:** Accepted

Do not begin with microservices or distributed infrastructure.

**Reason:** The platform needs validated business requirements before operational complexity is justified.

---

## Decision 007 — Dedicated Backend API Boundary

**Status:** Accepted

The backend business logic is centralized in `@dissafyt/api`, with an established architectural path for independent deployment at `api.dissafyt.com`.

**Reason:**
- Centralizes business rules (availability calculations, collision prevention, PayFast signature verification).
- Provides one uniform interface for both customer and admin applications.
- Enables future mobile or third-party apps to consume the exact same capabilities without rewriting business logic.

---

## Decision 008 — Barbershop is a Network-Capable Module

**Status:** Accepted

The Barbershop module must not be architected around a single shop or single barber.

**Reason:**
- Physical premises create a scaling ceiling and increase fixed overheads.
- Providers (barbers) and physical locations need to be independently represented.
- The platform digital infrastructure must support multiple barbers, multiple branches, and future affiliated provider networks.

---

## Decision 009 — Documentation Follows the Business Model

**Status:** Accepted

Database schemas and API design must follow confirmed business requirements.

**Reason:** We should not design arbitrary database tables first and then force real-world business workflows to fit the database.

