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

  const token =
    request.cookies.get('dissafyt_pos_token')?.value ||
    request.cookies.get('dissafyt_admin_token')?.value;
  const isLoginPage = pathname === '/login';

  // 2. Unauthenticated Guard: Redirect any unauthorized visitor to /login
  if (!token) {
    if (!isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 3. Authenticated Visitor on /login: Redirect to POS Register
  if (token && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
