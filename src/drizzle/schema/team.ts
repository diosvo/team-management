import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { RuleTable } from './rule';
import { UserTable } from './user';

export const TeamTable = pgTable(
  'team',
  {
    team_id: uuid('team_id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    email: varchar('email', { length: 128 }).unique(),
    establish_year: integer('establish_year')
      .default(new Date().getFullYear())
      .notNull(),
    is_default: boolean('is_default').default(false).notNull(),
    created_at,
    updated_at,
  },
  (table) => [
    check(
      'establish_year',
      sql`${table.establish_year} BETWEEN 2000 AND date_part('year', CURRENT_DATE)`
    ),
    // Ensure that there is only one default team
    uniqueIndex('default_team')
      .on(table.is_default)
      .where(sql`${table.is_default} = true`),
  ]
);

export const TeamRelations = relations(TeamTable, ({ one, many }) => ({
  rule: one(RuleTable),
  users: many(UserTable),
}));

export type Team = typeof TeamTable.$inferSelect;
export type InsertTeam = typeof TeamTable.$inferInsert;
