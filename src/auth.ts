import NextAuth from 'next-auth';

import { db } from '@/drizzle';
import { AccountTable, UserRoles, UserTable } from '@/drizzle/schema/user';
import { getUserById } from '@/features/user/db/auth';
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
  callbacks: {
    async signIn({ user }) {
      const existingUser = await getUserById(user.id as string);

      if (!existingUser || !existingUser.emailVerified) {
        return false;
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.roles && session.user) {
        session.user.roles = token.roles as UserRoles;
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
  ...authConfig,
});
