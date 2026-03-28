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
import { can } from '@/utils/permissions';

/**
 * Resolves the current pathname to a `Resource` using prefix matching.
 * e.g. `/periodic-testing/add-result` → `periodic-testing`
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
  const currentPath = req.nextUrl.pathname;
  const isProtectedRoute = !PUBLIC_ROUTES.has(currentPath);
  const isAuthRoute = AUTH_ROUTES.add('/').has(currentPath);

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

  // Route-level permission check using cookie cache
  if (isLoggedIn && isProtectedRoute) {
    const resource = resolveResource(currentPath);

    if (resource) {
      const session = await getCookieCache(req, {
        cookiePrefix: COOKIE.prefix,
      });

      const role = session?.user?.role as UserRole;

      if (!role || !can(role, resource, 'view')) {
        return redirectTo(DEFAULT_LOGIN_REDIRECT);
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
