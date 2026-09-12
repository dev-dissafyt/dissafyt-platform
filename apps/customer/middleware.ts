import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolvePlatformApp, extractSubdomain, PLATFORM_APPS } from './config/domains.config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Skip Next.js internals, static assets, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Global API endpoints remain universally accessible from all subdomains
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next();
    response.headers.set('x-platform-host', host);
    return response;
  }

  // 3. Resolve the target application based on Subdomain or Query Override (?app=ops)
  const queryOverride = request.nextUrl.searchParams.get('app');
  const targetApp = resolvePlatformApp(host, queryOverride);
  const subdomain = extractSubdomain(host);

  // Set tracking headers for components and layout inspection
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-platform-app', targetApp.id);
  requestHeaders.set('x-platform-subdomain', subdomain);
  requestHeaders.set('x-platform-name', targetApp.name);

  // 4. If Customer Storefront / Root domain (dissafyt.com, www.dissafyt.com, localhost)
  if (targetApp.id === 'customer') {
    // Check if visitor is accessing a module path directly (e.g. /ops, /studio, /admin, /pos)
    const matchedModule = Object.values(PLATFORM_APPS).find(
      (app) => app.id !== 'customer' && app.routePrefix && (pathname === app.routePrefix || pathname.startsWith(`${app.routePrefix}/`))
    );

    if (matchedModule) {
      // In production (*.dissafyt.com), redirect to canonical subdomain (e.g. ops.dissafyt.com)
      if (host.endsWith('dissafyt.com')) {
        const canonicalSub = matchedModule.subdomains[0];
        const subPath = pathname.replace(new RegExp(`^${matchedModule.routePrefix}`), '') || '/';
        const redirectUrl = new URL(subPath, `https://${canonicalSub}.dissafyt.com`);
        request.nextUrl.searchParams.forEach((val, key) => redirectUrl.searchParams.set(key, val));
        return NextResponse.redirect(redirectUrl);
      }

      // On localhost / preview deployments, set tracking headers and allow direct path execution
      requestHeaders.set('x-platform-app', matchedModule.id);
      requestHeaders.set('x-platform-subdomain', matchedModule.subdomains[0]);
      requestHeaders.set('x-platform-name', matchedModule.name);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. If Subdomain Application (ops.dissafyt.com, admin.dissafyt.com, studio.dissafyt.com, pos.dissafyt.com)
  const routePrefix = targetApp.routePrefix; // e.g. "/ops"

  let internalPath = pathname;
  if (routePrefix && !pathname.startsWith(routePrefix)) {
    internalPath = pathname === '/' ? routePrefix : `${routePrefix}${pathname}`;
  }

  const rewriteUrl = new URL(internalPath, request.url);

  // Retain all existing search params
  request.nextUrl.searchParams.forEach((val, key) => {
    rewriteUrl.searchParams.set(key, val);
  });

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
