import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { UserRole, UserState } from '@/utils/enum';

import { created_at, expires_at, updated_at } from '../helpers';
import { Coach, CoachTable } from './coach';
import { Player, PlayerTable } from './player';
import { TeamTable } from './team';

export const userRoleEnum = pgEnum('user_role', UserRole);
export const userStateEnum = pgEnum('user_state', UserState);

export const UserTable = pgTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text(),
  createdAt: created_at,
  updatedAt: updated_at,
  // Additional fields
  team_id: uuid()
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  dob: date(),
  phone_number: varchar({ length: 10 }),
  citizen_identification: varchar({ length: 12 }),
  state: userStateEnum().default(UserState.UNKNOWN).notNull(),
  role: userRoleEnum().default(UserRole.PLAYER).notNull(),
  join_date: date(),
  leave_date: date(),
});

export const UserRelations = relations(UserTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [UserTable.team_id],
    references: [TeamTable.team_id],
  }),
  coach: one(CoachTable, {
    fields: [UserTable.id],
    references: [CoachTable.id],
  }),
  player: one(PlayerTable, {
    fields: [UserTable.id],
    references: [PlayerTable.id],
  }),
}));

export const SessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: expires_at,
  token: text('token').notNull().unique(),
  createdAt: created_at,
  updatedAt: updated_at,
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
});

export const AccountTable = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: created_at,
  updatedAt: updated_at,
});

export const VerificationTable = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: expires_at,
  createdAt: created_at,
  updatedAt: updated_at,
});

type UserInfo = typeof UserTable.$inferSelect;
export type User = UserInfo &
  Partial<{
    player: Player;
    coach: Coach;
  }>;
export type InsertUser = typeof UserTable.$inferInsert;
