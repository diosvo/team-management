import { relations } from 'drizzle-orm';
import {
  date,
  decimal,
  pgEnum,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { TestTypeUnit } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';
import { UserTable } from './user';

export const testTypeUnitEnum = pgEnum('test_type_unit', TestTypeUnit);

export const TestTypeTable = pgTable(
  'test_type',
  {
    type_id: uuid().defaultRandom().primaryKey(),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id),
    name: varchar({ length: 64 }).unique().notNull(),
    unit: testTypeUnitEnum().default(TestTypeUnit.TIMES).notNull(),
    created_at,
    updated_at,
  },
  (table) => [
    // Ensure name is unique within a team
    uniqueIndex('team_test_type_name').on(table.team_id, table.name),
  ]
);

export const TestResultTable = pgTable('test_result', {
  result_id: uuid().defaultRandom().primaryKey(),
  user_id: uuid()
    .notNull()
    .references(() => UserTable.user_id),
  type_id: uuid()
    .notNull()
    .references(() => TestTypeTable.type_id),
  result: decimal({ precision: 10, scale: 3 }).notNull(),
  date: date(),
  created_at,
  updated_at,
});

export const TestResultRelations = relations(TestResultTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [TestResultTable.user_id],
    references: [UserTable.user_id],
  }),
  type: one(TestTypeTable, {
    fields: [TestResultTable.type_id],
    references: [TestTypeTable.type_id],
  }),
}));

export type TestType = typeof TestTypeTable.$inferSelect;
export type InsertTestType = typeof TestTypeTable.$inferInsert;
export type InsertTestResult = typeof TestResultTable.$inferInsert;
