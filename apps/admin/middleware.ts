import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignore Next.js internals, static files, images, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('dissafyt_admin_token')?.value;
  const role = request.cookies.get('dissafyt_admin_role')?.value;
  const isLoginPage = pathname === '/login';

  // 2. Unauthenticated Guard: Redirect any unauthorized visitor to /login
  if (!token) {
    if (!isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 3. Authenticated Visitor on /login: Redirect to Admin Dashboard
  if (token && isLoginPage) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('redirect');
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 4. Role Enforcement: Only 'admin' or 'staff' allowed in Admin Portal
  if (role && role !== 'admin' && role !== 'staff') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'unauthorized_role');
    const response = NextResponse.redirect(url);
    response.cookies.delete('dissafyt_admin_token');
    response.cookies.delete('dissafyt_admin_role');
    response.cookies.delete('dissafyt_admin_email');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
