import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, images, and API routes from path redirects
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const role = request.cookies.get('dissafyt_studio_role')?.value || 'staff';

  // 1. Factory Floor Routes: '/' and '/dispatch'
  // Strict Governance: Creators must NOT see the factory queue or courier waybills
  if (pathname === '/' || pathname.startsWith('/dispatch')) {
    if (role === 'creator') {
      const url = request.nextUrl.clone();
      url.pathname = '/creator';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
