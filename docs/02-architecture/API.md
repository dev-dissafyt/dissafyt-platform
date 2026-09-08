# DISSafyt API Specification

## Purpose

The DISSafyt API is the shared application/business layer between frontend applications and platform data.

## API responsibilities

- authentication verification
- authorization
- validation
- business logic
- database access
- external service integrations
- consistent errors
- audit-sensitive operations

## Conceptual endpoint groups

```text
/auth
/users
/products
/categories
/cart
/orders
/services
/staff
/bookings
/subscriptions
/payments
/notifications
/admin
```

## Identity endpoints

Conceptual:

```text
GET /users/me
PATCH /users/me
```

Authentication flows are delegated to the authentication service.

## Commerce endpoints

Conceptual:

```text
GET /products
GET /products/:id

GET /cart
POST /cart/items
PATCH /cart/items/:id
DELETE /cart/items/:id

POST /orders
GET /orders
GET /orders/:id
```

## Booking endpoints

Conceptual:

```text
GET /services
GET /services/:id

GET /availability
POST /bookings
GET /bookings
GET /bookings/:id
PATCH /bookings/:id
```

## Admin endpoints

Conceptual:

```text
GET /admin/users
GET /admin/orders
GET /admin/bookings
POST /admin/products
PATCH /admin/products/:id
```

Exact endpoint names should be finalized before implementation.

## Request lifecycle

```text
HTTP request
    |
Authenticate
    |
Authorize
    |
Validate
    |
Execute business rule
    |
Database/external service
    |
Return response
```

## Errors

The API should use predictable status codes and structured error responses.

Examples:

- 400 — invalid request
- 401 — unauthenticated
- 403 — authenticated but not authorized
- 404 — resource not found
- 409 — conflict
- 422 — validation/business input failure
- 500 — unexpected server error

## API versioning

If breaking changes become necessary, introduce explicit versioning rather than silently changing contracts used by deployed applications.

Possible future structure:

```text
/api/v1/...
```

## Rule

Business rules must live in the backend, not be duplicated independently across customer and admin frontends.
