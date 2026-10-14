import env from '@env';

/** Authorize a Vercel cron request via its Bearer CRON_SECRET. */
export function isAuthorizedCron(headers: Headers): boolean {
  if (!env.CRON_SECRET) return false;
  return headers.get('authorization') === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Host + origin of the incoming request, honoring the proxy's
 * `x-forwarded-proto`. Null when the host header is missing.
 */
export function requestOrigin(
  headers: Headers,
): Nullable<{ host: string; origin: string }> {
  const host = headers.get('host');
  if (!host) return null;

  const proto = headers.get('x-forwarded-proto') ?? 'http';
  return { host, origin: headers.get('origin') ?? `${proto}://${host}` };
}
