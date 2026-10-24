import { getCookieCache, getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
  LOGIN_PATH,
  PUBLIC_ROUTES,
  RESOURCES,
} from '@/routes';
import { COOKIE } from '@/utils/constants';
import { UserRole } from '@/utils/enum';
import { Status } from '@/utils/response';
import { docsUrl, i18n, parseDocsPath } from './app/docs/_lib/i18n';
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

/**
 * Public docs live at `src/app/docs/[lang]`, but the default language is
 * unprefixed: `/docs/roster` is served by `/docs/en/roster`, `/docs/vi/roster`
 * is served as-is, and an explicit `/docs/en/...` redirects to the canonical
 * unprefixed URL so every page has exactly one address.
 */
function handleDocs(
  req: NextRequest,
  docs: NonNullable<ReturnType<typeof parseDocsPath>>,
) {
  if (!docs.explicit) {
    const url = new URL(req.nextUrl);
    url.pathname = `/docs/${i18n.defaultLanguage}${req.nextUrl.pathname.slice('/docs'.length)}`;
    return NextResponse.rewrite(url);
  }

  if (docs.lang === i18n.defaultLanguage) {
    const url = new URL(req.nextUrl);
    url.pathname = docsUrl(docs.slugs, docs.lang);
    return NextResponse.redirect(url, Status.PERMANENT_REDIRECT);
  }

  return NextResponse.next();
}

export default async function proxy(req: NextRequest) {
  // Server actions own their own auth via `withAuth`
  if (req.headers.has('next-action')) {
    return NextResponse.next();
  }

  const currentPath = req.nextUrl.pathname;

  // Docs are public and need no session; they only need the language rewrite.
  const docs = parseDocsPath(currentPath);
  if (docs) return handleDocs(req, docs);
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
     * - llms (llms.txt / llms-full.txt / llms.mdx markdown exports of the docs)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static asset requests with common image extensions (png, svg, ico, etc.)
     */
    '/((?!api|llms|_next/static|_next/image|.*\\.(?:png|svg|jpg|jpeg|gif|ico|webp)$).*)',
  ],
};
