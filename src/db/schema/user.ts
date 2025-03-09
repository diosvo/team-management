import {
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// Enums

export const userRoles = ['SUPER_ADMIN', 'COACH', 'PLAYER', 'CAPTAIN'] as const;
export type UserRole = (typeof userRoles)[number];
export const userRolesEnum = pgEnum('user_roles', userRoles);

export const userStateEnum = pgEnum('user_state', [
  'UNKNOWN',
  'ACTIVE',
  'INACTIVE',
  'TEMPORARILY_ABSENT',
]);

// Tables

export const UserTable = pgTable('users', {
  user_id: uuid('user_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 128 }).notNull(),
  dob: date('dob').notNull(),
  username: varchar('username').notNull(),
  password: varchar('password', { length: 128 }).notNull(),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  phone_number: varchar('phone_number', { length: 15 }),
  roles: userRolesEnum('roles').notNull().array().default(['PLAYER']),
  image: text('image'),
  join_date: timestamp('join_date', { withTimezone: true })
    .defaultNow()
    .notNull(),
  state: userStateEnum('state').default('ACTIVE').notNull(),
});

export const AccountTable = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => UserTable.user_id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);
