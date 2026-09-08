# Dissafyt System Architecture

## Target model

```text
+-------------------+       +-------------------+
| Customer App      |       | Admin App         |
| Next.js           |       | Next.js           |
+---------+---------+       +---------+---------+
          |                           |
          +-------------+-------------+
                        |
                        v
              +-------------------+
              | Dissafyt API      |
              | Backend           |
              +---------+---------+
                        |
          +-------------+-------------+
          |                           |
          v                           v
+-------------------+       +-------------------+
| Authentication    |       | PostgreSQL        |
| Supabase Auth     |       | Supabase          |
+-------------------+       +-------------------+
```

## Boundary rules

### Applications

Applications handle presentation and interaction.

### API

The API handles platform business logic and data access.

### Database

PostgreSQL is the persistent source of truth.

### Authentication

The authentication provider handles identity and authentication mechanics.

### Authorization

Dissafyt backend logic determines whether an authenticated identity may perform an action.

## Deployment evolution

Initial:

```text
Customer Next.js
       |
       +-- backend/API
       |
       +-- Supabase
```

Later:

```text
Customer App ----+
Admin App -------+----> api.dissafyt.com
Mobile App ------+             |
                               v
                         Supabase
```

The API should be designed as an independent boundary even if its first deployment is coupled to the Next.js application.

## Architectural rule

Do not allow individual frontend applications to become the owners of shared business rules.
