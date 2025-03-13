/**
 * An array of routes that are accessible to the public.
 * These routes do not require authentication
 * @type {Array<string>}
 */
export const PUBLIC_ROUTES = ['/', '/bg-layer.jpeg'];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in in users to '/dashboard'
 */
export const AUTH_ROUTES = ['/login'];

/**
 * The prefix for API authentication routes.
 * Routes that start with this prefix are used for API authentication purposes.
 */
export const API_AUTH_PREFIX = '/api/auth' as const;

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard' as const;
