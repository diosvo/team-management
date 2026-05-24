import { getCookieCache, getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
  LOGIN_PATH,
  PUBLIC_ROUTES,
  RESOURCES,
} from '@/routes';
import { COOKIE } from '@/utils/constant';
import { UserRole } from '@/utils/enum';
import { can } from './utils/permissions';

/**
 * Resolves the current pathname to a `Resource` using prefix matching.
 *
 * _e.g.,_ `/periodic-testing/add-result` → `periodic-testing`
 */
function resolveResource(pathname: string) {
  for (const resource of RESOURCES) {
    if (pathname.startsWith(`/${resource}`)) {
      return resource;
    }
  }
  return undefined;
}

export default async function proxy(req: NextRequest) {
  // Server actions own their own auth via `withAuth`
  if (req.headers.has('next-action')) {
    return NextResponse.next();
  }

  const currentPath = req.nextUrl.pathname;
  const isProtectedRoute = !PUBLIC_ROUTES.has(currentPath);
  const isAuthRoute = AUTH_ROUTES.add('/').has(currentPath);

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl));

  // Fast check: Cookie read only, no DB (always GET/navigation request)
  const sessionCookie = getSessionCookie(req, { cookiePrefix: COOKIE.prefix });
  const isLoggedIn = !!sessionCookie;

  // Fast redirect: no cookie
  if (!isLoggedIn && isProtectedRoute) {
    return redirectTo(LOGIN_PATH);
  }

  // Fast redirect: Cookie exists and on auth route
  if (isLoggedIn && isAuthRoute) {
    return redirectTo(DEFAULT_LOGIN_REDIRECT);
  }

  if (isLoggedIn && isProtectedRoute) {
    // Full validation: Cookie cache read + Protected route
    const session = await getCookieCache(req, { cookiePrefix: COOKIE.prefix });

    if (!session) {
      // Session expired - cookie still present but cache is invalid
      return redirectTo(LOGIN_PATH);
    }

    const resource = resolveResource(currentPath);

    if (resource) {
      const role = session.user.role as UserRole;

      if (!can(role, resource, 'view')) {
        return redirectTo('/forbidden');
      }
    }
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
    '/((?!api|_next/static|_next/image|icon.svg).*)',
  ],
};
