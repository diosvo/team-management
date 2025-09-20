import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { Resend } from 'resend';

import env from '@/schemas/env';
import { COOKIE } from '@/utils/constant';
import { UserRole, UserState } from '@/utils/enum';

import db from '@/drizzle';
import {
  AccountTable,
  SessionTable,
  UserTable,
  VerificationTable,
} from '@/drizzle/schema/user';

import ResetPassword from '@/app/(auth)/_components/ResetPassword';

const resend = new Resend(env.RESEND_API_KEY);

export default betterAuth({
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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const email = user.email;
      const name = email.split('@')[0];

      await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
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
        required: false,
        defaultValue: null,
      },
    },
  },
  advanced: {
    cookiePrefix: COOKIE.prefix,
  },
  session: {
    expiresIn: COOKIE.expires,
  },
  plugins: [
    nextCookies(), // Ensure that it is the last plugin in the array
  ],
});
