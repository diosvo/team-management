import { addSeconds } from 'date-fns';
import type { useTranslations } from 'next-intl';

import { formatTime } from './datetime';
import { Status } from './response';

const GENERIC_MESSAGE = 'Rate limit exceeded. Please try again later.';

type AuthErrorContext = {
  error: { code?: string; message?: string; statusText?: string };
  response: { status: number; headers: Headers };
};

type AuthErrorTranslator = ReturnType<typeof useTranslations<'auth.errors'>>;

export function rateLimitMessage(
  headers: Headers,
  t?: AuthErrorTranslator,
): string {
  const seconds = Number(
    headers.get('X-Retry-After') ?? headers.get('Retry-After'),
  );
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return t ? t('rateLimit') : GENERIC_MESSAGE;
  }

  const time = formatTime(addSeconds(new Date(), seconds));
  return t
    ? t('rateLimitRetryAt', { time })
    : `Rate limit exceeded. Retry at ${time}`;
}

export function authErrorMessage(
  { error, response }: AuthErrorContext,
  t?: AuthErrorTranslator,
): string {
  if (response.status === Status.TOO_MANY_REQUESTS) {
    return rateLimitMessage(response.headers, t);
  }
  // better-auth error codes, e.g. `INVALID_EMAIL_OR_PASSWORD`
  if (t && error.code && t.has(error.code as never)) {
    return t(error.code as never);
  }
  return (
    error.message ||
    error.statusText ||
    (t ? t('generic') : 'Something went wrong.')
  );
}
