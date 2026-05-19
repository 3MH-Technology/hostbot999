import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /api/bots and /api/system
  if (pathname.startsWith('/api/bots') || pathname.startsWith('/api/system')) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const apiSecret = process.env.API_SECRET || 'fallback-secret-change-me';

    // Simple token check (In production, use JWT verification)
    if (token !== apiSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/bots/:path*', '/api/system/:path*'],
};
