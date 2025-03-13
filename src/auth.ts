import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { db } from '@/drizzle';
import { AccountTable, UserTable } from '@/drizzle/schema/user';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: UserTable,
    accountsTable: AccountTable,
  }),
  providers: [Google],
  session: {
    strategy: 'jwt',
    maxAge: 1 * 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: 'login',
    signOut: 'logout',
  },
});
