/** How long an emailed "Create a new password" link works, in seconds. */
export const PASSWORD_LINK_TTL = 60 * 60;

/**
 * Domain of the stand-in email for a member added before they share theirs.
 * `.invalid` is reserved (RFC 2606), so nothing can ever be delivered there.
 */
export const NO_EMAIL_DOMAIN = 'no-email.invalid';
