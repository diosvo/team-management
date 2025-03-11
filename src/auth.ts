import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { db } from '@/db';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { AccountTable, UserTable } from './db/schema/user';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: UserTable,
    accountsTable: AccountTable,
  }),
  providers: [Google],
  pages: {
    signIn: 'login',
    signOut: 'logout',
  },
});
