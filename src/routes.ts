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
 */
export const PUBLIC_ROUTES = new Set([...AUTH_ROUTES]);

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard' as const;

/**
 * All resources in the application that permissions can be applied to.
 */
export const RESOURCES = [
  'assets',
  'attendance',
  'dashboard',
  'documents',
  'emails',
  'leagues',
  'locations',
  'matches',
  'periodic-testing',
  'profile',
  'registration',
  'roster',
  'reports',
  'team-rule',
  'teams',
  'training',
] as const;
