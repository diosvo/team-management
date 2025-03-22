/**
 * The path to the login page.
 */
export const LOGIN_PATH = '/login';

/**
 * An array of routes that are accessible to the public.
 * These routes do not require authentication
 * @type {Array<string>}
 */
export const PUBLIC_ROUTES = [
  LOGIN_PATH,
  '/logo.png',
  '/bg-layer.jpeg',
  '/email-confirmation',
];

/**
 * The prefix for API authentication routes.
 * Routes that start with this prefix are used for API authentication purposes.
 */
export const API_AUTH_PREFIX = '/api/auth' as const;

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard' as const;
