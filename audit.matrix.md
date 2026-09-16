# Subdomain Rewrite Audit Matrix (Port 3000)

## Target Topology
- Base URL: `http://localhost:3000`
- Middleware Pattern: Next.js Rewrite via Host header
- Subdomains:
  - `http://customer.localhost:3000` -> `/(customer)` or `/customer` (root storefront)
  - `http://admin.localhost:3000`    -> `/(admin)` or `/admin`
  - `http://pos.localhost:3000`      -> `/(pos)` or `/pos`
  - `http://studio.localhost:3000`   -> `/(studio)` or `/studio`

## Rewrite & State Edge Cases to Audit
1. Static & Chunk Resolution
   - Verify CSS chunks and `/_next/static/...` resolve with HTTP 200 on all subdomains.
   - Verify public assets like `/ace-of-fyt-logo.svg`, `/logo.png`, and `/favicon.ico` resolve without rewrite interference.
2. Cross-Subdomain Auth & Cookie Scoping
   - Verify auth cookies use `Domain=.localhost` (or host-only cookies in dev) so sessions persist or isolate as intended.
3. Server Action Subdomain Origin
   - Verify Next.js Server Action CSRF header checks do not throw `403 Invalid Server Action Origin` on subdomains.
4. Route Isolation
   - Accessing `admin.localhost:3000/pos-specific-route` must return a 404, not route leakage.
   - Accessing `customer.localhost:3000/admin` must return a 404.
   - Accessing `pos.localhost:3000/admin` must return a 404.
   - Accessing `studio.localhost:3000/pos` must return a 404.
