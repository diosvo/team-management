import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';

export const RuleTable = pgTable('rule', {
  rule_id: uuid().primaryKey().defaultRandom(),
  team_id: uuid()
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  content: text().notNull(),
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
export type NullishRule = Nullish<Rule>;
export type InsertRule = typeof RuleTable.$inferInsert;
