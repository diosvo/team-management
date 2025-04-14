import { relations, sql } from 'drizzle-orm';
import { check, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { RuleTable } from './rule';

export const TeamTable = pgTable(
  'team',
  {
    team_id: uuid('team_id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    establish_year: integer('establish_year')
      .default(new Date().getFullYear())
      .notNull(),
    created_at,
    updated_at,
  },
  (table) => [
    check(
      'establish_year',
      sql`${table.establish_year} >= 2000 AND ${table.establish_year} <= date_part('year', CURRENT_DATE)`
    ),
  ]
);

export const TeamRelations = relations(TeamTable, ({ one }) => ({
  rule: one(RuleTable),
}));

export type Team = typeof TeamTable.$inferSelect;
export type InsertTeam = typeof TeamTable.$inferInsert;
