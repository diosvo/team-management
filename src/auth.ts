import NextAuth from 'next-auth';

import { db } from '@/drizzle';
import { AccountTable, UserRole, UserTable } from '@/drizzle/schema/user';
import { getUserById } from '@/features/user/db/auth';
import { updateVerificationDate } from '@/features/user/db/verification-token';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

import authConfig from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: UserTable,
    accountsTable: AccountTable,
  }),
  session: {
    strategy: 'jwt',
    // How long until an idle session expires and is no longer valid.
    maxAge: 30 * 24 * 60 * 60, // 30 days

    // Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    updateAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async linkAccount({ user }) {
      await updateVerificationDate(user.id as string, user.email as string);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== 'credentials') return true;

      const existingUser = await getUserById(user.id as string);

      // Prevent sign in without email verification
      if (!existingUser || !existingUser.emailVerified) return false;

      // TODO: Add 2FA check

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.roles && session.user) {
        session.user.roles = token.roles as Array<UserRole>;
      }

      return session;
    },
    async jwt({ token }) {
      const user_id = token.sub;

      if (!user_id) return token;

      const existingUser = await getUserById(user_id);

      if (!existingUser) return token;

      token.roles = existingUser.roles;

      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  ...authConfig,
});
