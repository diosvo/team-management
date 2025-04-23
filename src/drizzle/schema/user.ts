import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { UserRole, UserState } from '@/utils/enum';

import { created_at, expires_at, updated_at } from '../helpers';
import { TeamTable } from './team';

export const userRolesEnum = pgEnum('user_roles', UserRole);

export const userStateEnum = pgEnum('user_state', UserState);

// Tables
// Force id and userId by Drizzle ORM Adapter

export const UserTable = pgTable(
  'user',
  {
    user_id: uuid('user_id').primaryKey().defaultRandom(),
    team_id: uuid('team_id')
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 128 }).notNull(),
    dob: date('dob'),
    password: varchar('password', { length: 128 }),
    email: varchar('email', { length: 255 }).unique().notNull(),
    phone_number: varchar('phone_number', { length: 15 }),
    citizen_identification: varchar('citizen_identification', { length: 12 }),
    image: text('image'),
    state: userStateEnum('state').default(UserState.ACTIVE).notNull(),
    roles: userRolesEnum('roles').array().default([UserRole.PLAYER]).notNull(),
    join_date: date('join_date'),
    created_at,
    updated_at,
  },
  (table) => [
    check('roles_length', sql`array_length(${table.roles}, 1) BETWEEN 1 AND 2`),
  ]
);

export const UserRelations = relations(UserTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [UserTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export const PasswordTokenTable = pgTable('password_token', {
  id: uuid('id').notNull().unique().defaultRandom(),
  email: text('email').unique().notNull(),
  token: text('token').unique().notNull(),
  expires_at,
});

export type User = typeof UserTable.$inferSelect;
