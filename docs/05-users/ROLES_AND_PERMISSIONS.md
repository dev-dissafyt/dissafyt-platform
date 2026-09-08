# DISSafyt Roles and Permissions

## Roles

Initial:

```text
customer
barber
staff
admin
```

## Principle

Roles should map to permissions.

Example:

```text
customer
  |
  +-- profile.read_own
  +-- profile.update_own
  +-- orders.read_own
  +-- bookings.create
  +-- bookings.read_own

barber
  |
  +-- bookings.read_assigned
  +-- availability.manage_own

staff
  |
  +-- operational permissions as assigned

admin
  |
  +-- platform administration permissions
```

## Ownership

A user generally owns:

- their profile
- their orders
- their bookings
- their permitted account data

Ownership should be checked on the backend.

## Least privilege

Give each role only the permissions it needs.

Do not make every staff member an administrator simply because it is easier.

## Future model

The platform may eventually support permission assignment independently of roles.

```text
User
 |
Roles
 |
Permissions
```

This allows more granular staff access.
