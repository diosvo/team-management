import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { TeamTable } from './team';

export const RuleTable = pgTable('rule', {
  rule_id: uuid('rule_id').primaryKey().defaultRandom(),
  team_id: uuid('team_id')
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
});

export type Rule = typeof RuleTable.$inferSelect;
export type InsertRule = typeof RuleTable.$inferInsert;
