/**
 * Dissafyt Multi-App Wildcard Domain Configuration
 * Dynamically routes *.dissafyt.com subdomains to modular application surfaces.
 */

export type SubdomainAppId = 'customer' | 'admin' | 'studio' | 'ops' | 'pos';

export interface SubdomainAppConfig {
  id: SubdomainAppId;
  name: string;
  subdomains: string[];
  routePrefix: string;
  requiredRoles: string[];
  publicAccess: boolean;
  description: string;
  badge: string;
}

export const PLATFORM_APPS: Record<SubdomainAppId, SubdomainAppConfig> = {
  customer: {
    id: 'customer',
    name: 'Dissafyt Customer Storefront & Studio Booking',
    subdomains: ['', 'www'],
    routePrefix: '',
    requiredRoles: ['customer', 'barber', 'staff', 'admin'],
    publicAccess: true,
    description: 'E-commerce streetwear lab, Ace of Fyt haircut booking, and client portal',
    badge: 'STOREFRONT',
  },
  admin: {
    id: 'admin',
    name: 'Dissafyt Executive Governance & Financial Controls',
    subdomains: ['admin', 'hq'],
    routePrefix: '/admin',
    requiredRoles: ['admin', 'staff'],
    publicAccess: false,
    description: 'Catalog management, revenue reconciliation, RBAC, and system audit logs',
    badge: 'EXECUTIVE HQ',
  },
  studio: {
    id: 'studio',
    name: 'Ace of Fyt Creative Studio & Designer Lab',
    subdomains: ['studio', 'creator', 'design'],
    routePrefix: '/studio',
    requiredRoles: ['creator', 'admin'],
    publicAccess: false,
    description: 'Streetwear artist workspace, artwork submissions, mockups, and royalties',
    badge: 'CREATOR LAB',
  },
  ops: {
    id: 'ops',
    name: 'Dissafyt Factory & Fulfilment Operations',
    subdomains: ['ops', 'factory', 'fulfilment', 'dispatch', 'warehouse'],
    routePrefix: '/ops',
    requiredRoles: ['staff', 'admin'],
    publicAccess: false,
    description: 'Garment printing queue, DTG/embroidery production, inventory picking, and courier dispatch',
    badge: 'FACTORY FLOOR',
  },
  pos: {
    id: 'pos',
    name: 'Ace of Fyt Chairside Point of Sale',
    subdomains: ['pos', 'register', 'checkout'],
    routePrefix: '/pos',
    requiredRoles: ['barber', 'staff', 'admin'],
    publicAccess: false,
    description: 'In-chair barbershop checkout register, cash drawer, and barcode scanner',
    badge: 'REGISTER',
  },
};

/**
 * Extracts the clean subdomain prefix from an incoming Host header.
 * Works seamlessly with production (dissafyt.com), staging, and localhost development.
 *
 * Examples:
 * - "ops.dissafyt.com" -> "ops"
 * - "factory.dissafyt.com" -> "factory"
 * - "admin.localhost:3000" -> "admin"
 * - "www.dissafyt.com" -> "www"
 * - "dissafyt.com" -> ""
 * - "localhost:3000" -> ""
 */
export function extractSubdomain(hostHeader: string | null | undefined): string {
  if (!hostHeader) return '';

  // Remove port if present (e.g. "ops.localhost:3000" -> "ops.localhost")
  const host = hostHeader.split(':')[0].toLowerCase().trim();

  // Localhost development
  if (host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return '';
  }

  // Production / Staging domains (*.dissafyt.com)
  if (host.endsWith('dissafyt.com')) {
    const withoutRoot = host.replace('.dissafyt.com', '');
    if (withoutRoot === 'dissafyt.com' || withoutRoot === '') {
      return '';
    }
    // Return first subdomain if multi-level (e.g. ops.staging.dissafyt.com -> ops)
    return withoutRoot.split('.')[0];
  }

  // Fallback for Vercel preview URLs (e.g. "dissafyt-platform-git-main-*.vercel.app")
  return '';
}

/**
 * Resolves the appropriate SubdomainAppConfig from a host and optional query parameter override.
 */
export function resolvePlatformApp(
  hostHeader: string | null | undefined,
  queryOverride?: string | null
): SubdomainAppConfig {
  // 1. Check query parameter override (useful for fast local testing: ?app=ops)
  if (queryOverride) {
    const cleanOverride = queryOverride.toLowerCase().trim();
    for (const app of Object.values(PLATFORM_APPS)) {
      if (app.id === cleanOverride || app.subdomains.includes(cleanOverride)) {
        return app;
      }
    }
  }

  // 2. Extract subdomain from host header
  const subdomain = extractSubdomain(hostHeader);

  // 3. Match against configured subdomain lists
  for (const app of Object.values(PLATFORM_APPS)) {
    if (app.subdomains.includes(subdomain)) {
      return app;
    }
  }

  // 4. Default to customer storefront
  return PLATFORM_APPS.customer;
}
