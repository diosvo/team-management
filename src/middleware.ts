import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { COOKIE, decrypt } from '@/lib/session';
import {
  AUTH_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
  LOGIN_PATH,
  PUBLIC_ROUTES,
} from '@/routes';

export default async function middleware(req: NextRequest) {
  // 1. Check if route is protected
  const currentPath = req.nextUrl.pathname;
  const isProtectedRoutes = !PUBLIC_ROUTES.includes(currentPath);
  const isAuthRoute = [...AUTH_ROUTES, '/'].includes(currentPath);

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl));

  // 2. Decrypt the session from the cookie
  const cookie = (await cookies()).get(COOKIE.name)?.value;
  const session = await decrypt(cookie);
  const user_id = session?.user_id;

  // 3.1. Redirect authenticated users trying to access auth routes
  if (user_id && isAuthRoute) {
    return redirectTo(DEFAULT_LOGIN_REDIRECT);
  }

  // 3.2. Redirect unauthenticated users away from protected routes
  if (!user_id && isProtectedRoutes) {
    return redirectTo(LOGIN_PATH);
  }

  // 4. Allow all other requests to proceed
  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
