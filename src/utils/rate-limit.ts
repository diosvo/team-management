import { addSeconds } from 'date-fns';

import { formatTime } from './formatter';
import { Status } from './response';

const GENERIC_MESSAGE = 'Rate limit exceeded. Please try again later.';

type AuthErrorContext = {
  error: { message?: string; statusText?: string };
  response: { status: number; headers: Headers };
};

export function rateLimitMessage(headers: Headers): string {
  const seconds = Number(
    headers.get('X-Retry-After') ?? headers.get('Retry-After'),
  );
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return GENERIC_MESSAGE;
  }

  const retryAt = addSeconds(new Date(), seconds);
  return `Rate limit exceeded. Retry at ${formatTime(retryAt)}`;
}

export function authErrorMessage({
  error,
  response,
}: AuthErrorContext): string {
  if (response.status === Status.TOO_MANY_REQUESTS) {
    return rateLimitMessage(response.headers);
  }
  return error.message || error.statusText || 'Something went wrong.';
}
