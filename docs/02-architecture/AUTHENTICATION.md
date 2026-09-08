# DISSafyt Authentication Architecture

## Objective

Provide one identity system that can be used by:

- customer web application
- admin application
- future mobile application
- future DISSafyt applications

## Current direction

Use Supabase Auth.

Supabase Auth is responsible for:

- account registration
- credential handling
- authentication
- session/token lifecycle
- supported authentication providers
- password recovery/verification capabilities provided by the service

DISSafyt is responsible for:

- application profile
- roles
- permissions
- business authorization
- module-specific access

## Signup flow

```text
Customer
   |
Register
   |
Supabase Auth
   |
Authenticated identity created
   |
DISSafyt profile created/linked
   |
Default role = customer
```

## Login flow

```text
Customer
   |
Login
   |
Supabase Auth
   |
Authenticated session
   |
Customer application
```

## API request

```text
Application
   |
Authenticated request
   |
DISSafyt API
   |
Verify identity
   |
Identify user ID
   |
Authorize action
   |
Business logic
```

## Current user

The API should expose a current-user operation, conceptually:

```text
GET /users/me
```

This should return the authenticated user's DISSafyt profile and relevant identity information.

## Logout

Logout should invalidate the appropriate client authentication state/session through the authentication system.

## Session testing

The foundation must be tested for:

- logged-in request accepted
- logged-out request rejected
- expired/invalid session rejected
- customer cannot access admin resources
- customer cannot access another customer's private resources
- authorized admin can access permitted admin resources

## Security rule

Never implement a fake authentication system in the frontend.

The frontend may display UI based on authentication state, but the backend remains the final authority.
