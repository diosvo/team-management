import { relations } from 'drizzle-orm';
import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { updated_at } from '../helpers';
import { TeamTable } from './team';

export const RuleTable = pgTable(
  'rule',
  {
    rule_id: uuid('rule_id').primaryKey().defaultRandom(),
    team_id: uuid('team_id')
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    updated_at,
  },
  (table) => [uniqueIndex('team_idx').on(table.team_id)]
);

export const RuleRelations = relations(RuleTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [RuleTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export type Rule = typeof RuleTable.$inferSelect;
export type InsertRule = typeof RuleTable.$inferInsert;
