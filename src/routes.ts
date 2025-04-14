/**
 * The path to the login page.
 */
export const LOGIN_PATH = '/login';

/**
 * These routes are used for authentication purposes.
 * @type {Array<string>}
 */
const AUTH_ROUTES = [LOGIN_PATH, '/new-password'];

/**
 * An array of routes that are accessible to the public.
 * These routes do not require authentication
 * @type {Array<string>}
 */
export const PUBLIC_ROUTES = [...AUTH_ROUTES, '/logo.png'];

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard' as const;
