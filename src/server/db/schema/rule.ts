import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { team } from './team';

export const rule = pgTable('rule', {
  rule_id: uuid('rule_id').primaryKey().defaultRandom(),
  team_id: uuid('team_id')
    .notNull()
    .references(() => team.team_id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
});

export type Rule = typeof rule.$inferSelect;
export type InsertRule = typeof rule.$inferInsert;
