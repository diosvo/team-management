import NextAuth from 'next-auth';
import authConfig from './auth.config';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH, PUBLIC_ROUTES } from '@/routes';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const currentPath = nextUrl.pathname;

  // Helper functions
  const redirectTo = (path: string) =>
    Response.redirect(new URL(path, nextUrl));

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
});

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
