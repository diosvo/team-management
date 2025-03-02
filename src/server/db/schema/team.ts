import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const team = pgTable(
  'team',
  {
    team_id: uuid('team_id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    establish_year: integer('establish_year')
      .default(new Date().getFullYear())
      .notNull(),
  },
  (table) => [
    check(
      'establish_year',
      sql`${table.establish_year} >= 2000 AND ${table.establish_year} <= date_part('year', CURRENT_DATE)`
    ),
  ]
);

export type Team = typeof team.$inferSelect;
export type InsertTeam = typeof team.$inferInsert;
