import { relations } from 'drizzle-orm';
import {
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
import { TestResultTable } from './periodic-testing';
import { InsertPlayer, PlayerTable } from './player';
import { TeamTable } from './team';

export const userRolesEnum = pgEnum('user_role', UserRole);

export const userStateEnum = pgEnum('user_state', UserState);

// Tables

export const UserTable = pgTable('user', {
  user_id: uuid().defaultRandom().primaryKey(),
  team_id: uuid()
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  name: varchar({ length: 128 }).notNull(),
  dob: date(),
  password: varchar({ length: 128 }),
  email: varchar({ length: 128 }).unique().notNull(),
  phone_number: varchar({ length: 10 }),
  citizen_identification: varchar({ length: 12 }),
  image: text(),
  state: userStateEnum().default(UserState.UNKNOWN).notNull(),
  role: userRolesEnum().default(UserRole.PLAYER).notNull(),
  join_date: date(),
  created_at,
  updated_at,
});

export const UserRelations = relations(UserTable, ({ one, many }) => ({
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
  testResults: many(TestResultTable),
}));

export const PasswordTokenTable = pgTable('password_token', {
  id: uuid().notNull().unique().defaultRandom(),
  email: text().unique().notNull(),
  token: text().unique().notNull(),
  expires_at,
});

type UserInfo = typeof UserTable.$inferSelect;
export interface UserRelations extends UserInfo {
  asPlayer: InsertPlayer;
  asCoach: InsertCoach;
}
export interface User extends UserInfo {
  // Add `jerysey_number` to avoid syntax conflict
  details: InsertPlayer | (InsertCoach & { jersey_number?: number });
}
export type InsertUser = typeof UserTable.$inferInsert;
