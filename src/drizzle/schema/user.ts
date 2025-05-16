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
import { CoachTable, InsertCoach } from './coach';
import { InsertPlayer, PlayerTable } from './player';
import { TeamTable } from './team';

export const userRolesEnum = pgEnum('user_roles', UserRole);

export const userStateEnum = pgEnum('user_state', UserState);

// Tables

export const UserTable = pgTable(
  'user',
  {
    user_id: uuid('user_id').defaultRandom().primaryKey(),
    team_id: uuid('team_id')
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 128 }).notNull(),
    dob: date('dob'),
    password: varchar('password', { length: 128 }),
    email: varchar('email', { length: 128 }).unique().notNull(),
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
  asCoach: one(CoachTable, {
    fields: [UserTable.user_id],
    references: [CoachTable.user_id],
  }),
  asPlayer: one(PlayerTable, {
    fields: [UserTable.user_id],
    references: [PlayerTable.user_id],
  }),
}));

export const PasswordTokenTable = pgTable('password_token', {
  id: uuid('id').notNull().unique().defaultRandom(),
  email: text('email').unique().notNull(),
  token: text('token').unique().notNull(),
  expires_at,
});

type UserInfo = typeof UserTable.$inferSelect;
export interface User extends UserInfo {
  // Add `jerysey_number` to avoid syntax conflict
  details: InsertPlayer | (InsertCoach & { jersey_number?: number });
}
export type InsertUser = typeof UserTable.$inferInsert;
