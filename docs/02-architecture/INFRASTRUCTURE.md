# Dissafyt Infrastructure

## Initial technology direction

- Next.js for web applications
- Vercel for Next.js hosting
- Supabase for PostgreSQL and authentication
- API boundary designed for future independent deployment
- PayFast for initial payment direction

## Domains

Target architecture:

```text
dissafyt.com
    |
Customer application

admin.dissafyt.com
    |
Admin application

api.dissafyt.com
    |
Shared API/backend
```

The API domain may initially point to a backend deployment that is implemented within the Next.js ecosystem. It can become a dedicated deployment later.

## Environments

Maintain separate environments where practical:

```text
development
staging
production
```

Production secrets must never be committed to source control.

## Secrets

Examples of secrets:

- database credentials
- auth service secrets
- payment provider secrets
- webhook secrets
- email provider credentials

Secrets belong in environment configuration/secret management.

## Deployment principle

Deploy applications independently where practical.

A customer frontend deployment should not require rebuilding the admin frontend merely because the admin UI changed.

## Backups

The production database must have a documented backup/recovery strategy.

## Monitoring

At minimum, monitor:

- application errors
- API errors
- failed payment callbacks
- authentication failures where appropriate
- database health
- deployment failures

## Scaling

Scale only when evidence requires it.

The initial architecture should remain operationally simple.
