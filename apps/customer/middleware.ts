import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals, chunks, CSS)
     * 3. /_static (inside /public)
     * 4. Static files (favicon.ico, sitemap.xml, robots.txt, etc.)
     */
    '/((?!api|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const hostname = req.headers.get('host') || '';

  // Defense-in-depth safety check for Next.js internals, API, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Normalize hostname to extract tenant (e.g., admin.localhost:3000 -> admin)
  const currentHost = hostname.replace(`:${url.port}`, '').toLowerCase().trim();
  const hostParts = currentHost.split('.');
  
  // Determine subdomain
  let subdomain = '';
  if (currentHost.includes('localhost')) {
    if (hostParts.length > 1 && hostParts[0] !== 'localhost') {
      subdomain = hostParts[0];
    }
  } else if (currentHost.endsWith('dissafyt.com')) {
    if (hostParts.length > 2 && hostParts[0] !== 'www') {
      subdomain = hostParts[0];
    }
  }

  // Query parameter override for preview / testing (?app=admin)
  const queryOverride = url.searchParams.get('app');
  if (queryOverride && ['admin', 'pos', 'studio', 'customer', 'ops'].includes(queryOverride)) {
    subdomain = queryOverride;
  }

  // Set request tracking headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-platform-host', hostname);

  // 1. ADMIN SUBDOMAIN (admin.localhost:3000 / admin.dissafyt.com)
  if (subdomain === 'admin') {
    requestHeaders.set('x-platform-app', 'admin');
    requestHeaders.set('x-platform-subdomain', 'admin');

    // Route Isolation: Visiting pos/studio/ops routes on admin subdomain returns 404
    if (['/pos', '/studio', '/ops'].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.rewrite(new URL('/not-found', req.url), {
        headers: requestHeaders,
      });
    }

    let targetPath = pathname;
    if (pathname === '/') {
      targetPath = '/admin';
    } else if (!pathname.startsWith('/admin')) {
      targetPath = `/admin${pathname}`;
    }

    const rewriteUrl = new URL(targetPath, req.url);
    url.searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. POS SUBDOMAIN (pos.localhost:3000 / pos.dissafyt.com)
  if (subdomain === 'pos') {
    requestHeaders.set('x-platform-app', 'pos');
    requestHeaders.set('x-platform-subdomain', 'pos');

    // Route Isolation: Visiting admin/studio/ops routes on pos subdomain returns 404
    if (['/admin', '/studio', '/ops'].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.rewrite(new URL('/not-found', req.url), {
        headers: requestHeaders,
      });
    }

    let targetPath = pathname;
    if (pathname === '/') {
      targetPath = '/pos';
    } else if (!pathname.startsWith('/pos')) {
      targetPath = `/pos${pathname}`;
    }

    const rewriteUrl = new URL(targetPath, req.url);
    url.searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. STUDIO SUBDOMAIN (studio.localhost:3000 / studio.dissafyt.com)
  if (subdomain === 'studio') {
    requestHeaders.set('x-platform-app', 'studio');
    requestHeaders.set('x-platform-subdomain', 'studio');

    // Route Isolation: Visiting admin/pos/ops routes on studio subdomain returns 404
    if (['/admin', '/pos', '/ops'].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.rewrite(new URL('/not-found', req.url), {
        headers: requestHeaders,
      });
    }

    let targetPath = pathname;
    if (pathname === '/') {
      targetPath = '/studio';
    } else if (!pathname.startsWith('/studio')) {
      targetPath = `/studio${pathname}`;
    }

    const rewriteUrl = new URL(targetPath, req.url);
    url.searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. CUSTOMER SUBDOMAIN (customer.localhost:3000 / customer.dissafyt.com)
  if (subdomain === 'customer') {
    requestHeaders.set('x-platform-app', 'customer');
    requestHeaders.set('x-platform-subdomain', 'customer');

    // Route Isolation: Visiting admin/pos/studio/ops routes on customer subdomain returns 404
    if (['/admin', '/pos', '/studio', '/ops'].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.rewrite(new URL('/not-found', req.url), {
        headers: requestHeaders,
      });
    }

    // Customer storefront routes are served from the root
    let targetPath = pathname;
    if (pathname === '/customer' || pathname === '/customer/') {
      targetPath = '/';
    } else if (pathname.startsWith('/customer/')) {
      targetPath = pathname.replace(/^\/customer/, '') || '/';
    }

    const rewriteUrl = new URL(targetPath, req.url);
    url.searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. ROOT DOMAIN (localhost:3000, dissafyt.com, www.dissafyt.com)
  requestHeaders.set('x-platform-app', 'customer');
  requestHeaders.set('x-platform-subdomain', '');

  // If root domain accesses a module path directly (e.g. /admin, /pos, /studio), set appropriate headers
  if (pathname.startsWith('/admin')) {
    requestHeaders.set('x-platform-app', 'admin');
    requestHeaders.set('x-platform-subdomain', 'admin');
  } else if (pathname.startsWith('/pos')) {
    requestHeaders.set('x-platform-app', 'pos');
    requestHeaders.set('x-platform-subdomain', 'pos');
  } else if (pathname.startsWith('/studio')) {
    requestHeaders.set('x-platform-app', 'studio');
    requestHeaders.set('x-platform-subdomain', 'studio');
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
