import { dash } from '@better-auth/infra';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { nextCookies } from 'better-auth/next-js';
import { customSession } from 'better-auth/plugins';

import env from '@env';
import { COOKIE } from '@/utils/constants';
import { UserRole, UserState } from '@/utils/enum';

import { sendEmail } from '@/lib/resend';

import ResetPassword from '@/app/(auth)/_components/ResetPassword';
import { isCaptain } from '@/db/player';
import db from '@/drizzle';
import {
  AccountTable,
  SessionTable,
  UserTable,
  VerificationTable,
} from '@/drizzle/schema/user';

/**
 * Credential routes: 3 requests/min per IP + path.
 * Others use the global limit.
 */
const STRICT_RATE_LIMIT = {
  window: 60,
  max: 3,
};

const options = {
  appName: 'Saigon Rovers Basketball Club Portal',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: UserTable,
      session: SessionTable,
      account: AccountTable,
      verification: VerificationTable,
    },
  }),
  trustedOrigins: [env.DEV_URL, env.PRODUCTION_URL],
  // https://better-auth.com/docs/concepts/rate-limit
  rateLimit: {
    enabled: true,
    // Keep the global limit loose to avoid 429s from frequent /get-session hits.
    window: 10,
    max: 100,
    customRules: {
      '/sign-in/*': STRICT_RATE_LIMIT, // authClient.signIn.email
      '/request-password-reset': STRICT_RATE_LIMIT, // authClient.requestPasswordReset
      '/reset-password': STRICT_RATE_LIMIT, // authClient.resetPassword
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const email = user.email;
      const name = email.split('@')[0] ?? email;

      await sendEmail({
        to: email,
        subject: 'Create a new password',
        html: ResetPassword({ name, url }),
      });
    },
  },
  user: {
    additionalFields: {
      state: {
        type: 'string', // userRoleEnum
        required: true,
        defaultValue: UserState.UNKNOWN,
      },
      role: {
        type: 'string', // userStateEnum
        required: true,
        defaultValue: UserRole.PLAYER,
      },
      team_id: {
        type: 'string',
        required: true,
      },
    },
  },
  advanced: {
    cookiePrefix: COOKIE.prefix,
  },
  // https://better-auth.com/docs/concepts/session-management
  session: {
    expiresIn: COOKIE.expires,
    cookieCache: {
      enabled: true,
      maxAge: COOKIE.maxAge, // Cache duration in seconds
    },
  },
} satisfies BetterAuthOptions;

export default betterAuth({
  ...options,
  plugins: [
    dash(),
    // `is_captain` is joined here for permission checks.
    customSession(
      async ({ user, session }) => ({
        user: { ...user, is_captain: await isCaptain(user.id) },
        session,
      }),
      options,
    ),
    nextCookies(), // Ensure that it is the last plugin in the array
  ],
});
