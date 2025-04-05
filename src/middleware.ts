import { NextResponse } from 'next/server';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH, PUBLIC_ROUTES } from '@/routes';

import { auth as middleware } from '@/auth';
import logger from '@/lib/logger';

export default middleware((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const currentPath = nextUrl.pathname;

  // Improved logging to check session expiration
  if (req.auth?.expires) {
    logger.info(
      'Session expires at %s',
      new Date(req.auth.expires).toLocaleString()
    );
  }

  // Helper functions
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, nextUrl));

  const isPublicRoute = (path: string) => PUBLIC_ROUTES.includes(path);

  const isAuthRoute = (path: string) =>
    [LOGIN_PATH, '/'].some((route) => route === path);

  // Redirect authenticated users trying to access auth routes
  if (isLoggedIn && isAuthRoute(currentPath)) {
    return redirectTo(DEFAULT_LOGIN_REDIRECT);
  }

  // Redirect unauthenticated users away from protected routes
  if (!isLoggedIn && !isPublicRoute(currentPath)) {
    return redirectTo(LOGIN_PATH);
  }

  // Allow all other requests to proceed
  return NextResponse.next();
});

// Routes Middleware should not run on
export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
