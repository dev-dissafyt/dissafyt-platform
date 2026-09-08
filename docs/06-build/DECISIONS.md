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

## Future decisions

Continue adding decisions here.

Recommended format:

```text
Decision number
Title
Status
Date
Context
Options
Decision
Reason
Consequences
```
