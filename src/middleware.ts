// export { auth as middleware } from '@/auth';

import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // console.log('Route Middleware', req.nextUrl.pathname);

  return NextResponse.next();
}

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
