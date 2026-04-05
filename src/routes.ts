/**
 * The path to the login page.
 */
export const LOGIN_PATH = '/login';

/**
 * These routes are used for authentication purposes.
 * @type {Array<string>}
 */
export const AUTH_ROUTES = new Set([
  LOGIN_PATH,
  '/forgot-password',
  '/new-password',
]);

/**
 * An array of routes that are accessible to the public.
 * These routes do not require authentication
 * @type {Array<string>}
 */
export const PUBLIC_ROUTES = new Set([
  ...AUTH_ROUTES,
  '/logo.svg',
  '/squiggle.svg',
]);

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard' as const;

/**
 * All resources in the application that permissions can be applied to.
 */
export const RESOURCES = [
  'dashboard',
  'analytics',
  'team-rule',
  'roster',
  'training',
  'attendance',
  'registration',
  'matches',
  'periodic-testing',
  'assets',
  'documents',
  'cache-store',
  'leagues',
  'locations',
  'profile',
] as const;
