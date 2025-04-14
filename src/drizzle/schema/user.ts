import { sql } from 'drizzle-orm';
import {
  check,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { created_at, expires_at, updated_at } from '../helpers';

// Enums

export const userRoles = [
  'COACH',
  'PLAYER',
  'CAPTAIN',
  'GUEST',
  'SUPER_ADMIN',
] as const;
export const SELECTABLE_ROLES = [
  'COACH',
  'PLAYER',
  'CAPTAIN',
  'GUEST',
] as const;
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

export const UserTable = pgTable(
  'user',
  {
    user_id: uuid('user_id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    dob: date('dob'),
    password: varchar('password', { length: 128 }),
    email: text('email').unique().notNull(),
    phone_number: varchar('phone_number', { length: 15 }),
    citizen_identification: varchar('citizen_identification', { length: 12 }),
    image: text('image'),
    state: userStateEnum('state').default('ACTIVE').notNull(),
    roles: userRolesEnum('roles').array().default(['PLAYER']).notNull(),
    join_date: timestamp('join_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at,
    updated_at,
  },
  (table) => [
    check('roles_length', sql`array_length(${table.roles}, 1) BETWEEN 1 AND 2`),
  ]
);

export const PasswordTokenTable = pgTable('password_token', {
  id: uuid('id').notNull().unique().defaultRandom(),
  email: text('email').unique().notNull(),
  token: text('token').unique().notNull(),
  expires_at,
});

export type User = typeof UserTable.$inferSelect;
