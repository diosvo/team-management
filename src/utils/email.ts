import { NO_EMAIL_DOMAIN } from './constants';

/**
 * A unique stand-in email: `email` is required and unique on the user row,
 * and Better Auth needs one. The member's records hang off their user id, so
 * swapping in the real email later keeps all of them.
 */
export const placeholderEmail = (): string =>
  `${crypto.randomUUID()}@${NO_EMAIL_DOMAIN}`;

export const isPlaceholderEmail = (email: string): boolean =>
  email.trim().toLowerCase().endsWith(`@${NO_EMAIL_DOMAIN}`);

/** Mail to a reserved `.invalid` domain can never arrive, so never send it. */
export const isDeliverable = (email: string): boolean =>
  !email.trim().toLowerCase().endsWith('.invalid');

/** The email to show, or `null` for a placeholder ("No email"). */
export const visibleEmail = (email: string): string | null =>
  isPlaceholderEmail(email) ? null : email;
