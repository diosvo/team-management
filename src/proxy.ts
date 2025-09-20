import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

import {
  AUTH_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
  LOGIN_PATH,
  PUBLIC_ROUTES,
} from '@/routes';
import { COOKIE } from '@/utils/constant';

export default async function proxy(req: NextRequest) {
  const currentPath = req.nextUrl.pathname;
  const isProtectedRoute = !PUBLIC_ROUTES.has(currentPath);
  const isAuthRoute = AUTH_ROUTES.has(currentPath);

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl));

  // https://www.better-auth.com/docs/integrations/next#middleware
  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: COOKIE.prefix,
  });
  const isLoggedIn = !!sessionCookie;

  // Redirect unauthenticated users from protected routes
  if (!isLoggedIn && isProtectedRoute) {
    return redirectTo(LOGIN_PATH);
  }

  // Redirect authenticated users from auth routes
  if (isLoggedIn && isAuthRoute) {
    return redirectTo(DEFAULT_LOGIN_REDIRECT);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Metadata files
     */
    '/((?!api|_next/static|_next/image|icon.png).*)',
  ],
};
