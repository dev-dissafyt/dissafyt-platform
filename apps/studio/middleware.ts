import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignore Next.js internals, static assets, images, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('dissafyt_studio_auth')?.value;
  const isLoginPage = pathname === '/login';
  const role = request.cookies.get('dissafyt_studio_role')?.value || 'staff';

  // 2. Unauthenticated Guard: Redirect any unauthorized visitor to /login
  if (!authCookie) {
    if (!isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 3. Authenticated Visitor on /login: Redirect to their designated workstation
  if (authCookie && isLoginPage) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('redirect');
    url.pathname = role === 'creator' ? '/creator' : '/';
    return NextResponse.redirect(url);
  }

  // 4. Role-Based Access Control (RBAC) Governance:
  // - Streetwear Creators must NEVER see the factory production floor or courier waybills
  if (role === 'creator') {
    if (pathname === '/' || pathname.startsWith('/dispatch')) {
      const url = request.nextUrl.clone();
      url.pathname = '/creator';
      return NextResponse.redirect(url);
    }
  }

  // - Factory Floor Operators (Employees) must NEVER see private creator designs, royalties, or payout banking
  if (role === 'staff') {
    if (pathname.startsWith('/creator')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
