# Dissafyt User System

## Objective

Create one unified customer identity for the entire platform.

## Identity

The authentication provider owns authentication identity.

Dissafyt stores application-specific profile information.

```text
Auth identity
    |
    +-- user ID
    +-- email/authentication data
             |
             v
        Dissafyt profile
             |
             +-- customer information
             +-- preferences
             +-- addresses
             +-- role relationships
```

## Account lifecycle

```text
Register
   |
Verify/authenticate as required
   |
Profile initialized
   |
Customer role assigned
   |
Account active
```

Future account states may include:

- suspended
- deactivated
- deleted/anonymized

## Profile editing

Customers should be able to update permitted profile information.

Conceptual:

```text
GET /users/me
PATCH /users/me
```

## Privacy

Only collect information required for:

- service delivery
- orders/shipping
- communication
- legal/compliance requirements
- useful customer experience

Do not collect personal data merely because the database can store it.

## Unified history

The user's profile should provide a common identity across:

- purchases
- bookings
- subscriptions
- notifications

## Data separation

Do not mix authentication secrets with normal customer profile data.
