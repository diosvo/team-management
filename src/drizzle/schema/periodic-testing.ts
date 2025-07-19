import { relations } from 'drizzle-orm';
import {
  date,
  decimal,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { TestTypeUnit } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { UserTable } from './user';

export const testTypeUnitEnum = pgEnum('test_type_unit', TestTypeUnit);

export const TestTypeTable = pgTable('test_type', {
  type_id: uuid().primaryKey().notNull(),
  name: varchar({ length: 64 }).notNull(),
  unit: testTypeUnitEnum().notNull(),
  created_at,
  updated_at,
});

export const TestResultTable = pgTable('test_result', {
  result_id: uuid().primaryKey().notNull(),
  user_id: uuid()
    .notNull()
    .references(() => UserTable.user_id, { onDelete: 'cascade' }),
  type_id: uuid()
    .notNull()
    .references(() => TestTypeTable.type_id, { onDelete: 'cascade' }),
  result: decimal({ precision: 10, scale: 3 }).notNull(),
  date: date(),
  created_at,
  updated_at,
});

export const TestTypeRelations = relations(TestTypeTable, ({ many }) => ({
  results: many(TestResultTable),
}));

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
export type TestResult = typeof TestResultTable.$inferSelect;
export type InsertTestResult = typeof TestResultTable.$inferInsert;
