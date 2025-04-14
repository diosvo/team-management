import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';

export const RuleTable = pgTable('rule', {
  rule_id: uuid('rule_id').primaryKey().defaultRandom(),
  team_id: uuid('team_id')
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  created_at,
  updated_at,
});

export const RuleRelations = relations(RuleTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [RuleTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export type Rule = typeof RuleTable.$inferSelect;
export type InsertRule = typeof RuleTable.$inferInsert;
