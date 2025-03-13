import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';

import { db } from '@/drizzle';
import { AccountTable, UserTable } from '@/drizzle/schema/user';

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
  pages: {
    signIn: 'login',
    signOut: 'logout',
  },
  ...authConfig,
});
