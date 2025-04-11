import { type NextRequest, NextResponse } from 'next/server';

import { toaster } from '@/components/ui/toaster';
import { verifySession } from '@/lib/session';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH, PUBLIC_ROUTES } from '@/routes';

export default async function middleware(req: NextRequest) {
  // Check if route is protected
  const currentPath = req.nextUrl.pathname;
  const isProtectedRoutes = !PUBLIC_ROUTES.includes(currentPath);
  const isAuthRoute = [LOGIN_PATH, '/'].includes(currentPath);

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl));

  const session = await verifySession();

  // If session is not valid, redirect to login
  if (!session) {
    toaster.error({
      description: 'Session has been expired. Redirecting to login page...',
      duration: 5000,
    });
    return redirectTo(LOGIN_PATH);
  }

  const user_id = session.user_id;

  // Redirect authenticated users trying to access auth routes
  if (user_id && isAuthRoute) {
    return redirectTo(DEFAULT_LOGIN_REDIRECT);
  }

  // Redirect unauthenticated users away from protected routes
  if (!user_id && isProtectedRoutes) {
    return redirectTo(LOGIN_PATH);
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
