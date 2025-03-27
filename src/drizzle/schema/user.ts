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

import { created_at, expires_at, updated_at } from '../helpers';

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
// Force id and userId by Drizzle ORM Adapter

export const UserTable = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 128 }).notNull(),
  dob: date('dob'),
  password: varchar('password', { length: 128 }),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  phone_number: varchar('phone_number', { length: 15 }),
  citizen_identification: varchar('citizen_identification', { length: 12 }),
  image: text('image'),
  state: userStateEnum('state').default('ACTIVE').notNull(),
  roles: userRolesEnum('roles').notNull().array().default(['PLAYER']),
  join_date: timestamp('join_date', { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_at,
  updated_at,
});

export const AccountTable = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
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

export const VerificationTokenTable = pgTable('verification_token', {
  id: uuid('id').notNull().unique().defaultRandom(),
  email: text('email').unique().notNull(),
  token: text('token').unique().notNull(),
  expires_at,
});

export const PasswordResetTokenTable = pgTable('password_reset_token', {
  id: uuid('id').notNull().unique().defaultRandom(),
  email: text('email').unique().notNull(),
  token: text('token').unique().notNull(),
  expires_at,
});

export type User = typeof UserTable.$inferSelect;
export type Token = typeof VerificationTokenTable.$inferSelect;
