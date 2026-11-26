import { isDeliverable } from '@/utils/email';

import auth from '@/lib/auth';

/** Where the emailed link lands; the page calls `authClient.resetPassword`. */
export const PASSWORD_SETUP_PATH = '/new-password';

/**
 * Emails a "Create a new password" link. Used for both an invite (the user has
 * no password yet) and a reset: Better Auth has no invite flow for accounts
 * that don't exist yet, and `resetPassword` adds the credential account when
 * it is missing.
 */
export async function sendPasswordSetup(email: string) {
  if (!isDeliverable(email)) throw new Error('No deliverable email');
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: PASSWORD_SETUP_PATH },
  });
}
