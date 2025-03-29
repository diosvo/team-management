import NextAuth from 'next-auth';

import { db } from '@/drizzle';
import { AccountTable, UserRole, UserTable } from '@/drizzle/schema/user';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

import { getAccountById, getUserById } from '@/features/user/db/auth';
import { updateVerificationDate } from '@/features/user/db/verification-token';

import authConfig from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: UserTable,
    accountsTable: AccountTable,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
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

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.roles && session.user) {
        session.user.roles = token.roles as Array<UserRole>;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      const user_id = token.sub;

      if (!user_id) return token;

      const existingUser = await getUserById(user_id);
      if (!existingUser) return token;

      const existingAccount = await getAccountById(existingUser.id);

      token.name = existingUser.name;
      token.email = existingUser.email;
      token.roles = existingUser.roles as Array<UserRole>;
      token.image = existingUser.image;
      token.isOAuth = !!existingAccount;

      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  ...authConfig,
});
