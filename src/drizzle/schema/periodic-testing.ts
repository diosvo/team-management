import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { enumValues, TestTypeUnit } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { PlayerTable } from './player';
import { TeamTable } from './team';
import { UserTable } from './user';

export const testTypeUnitEnum = pgEnum(
  'test_type_unit',
  enumValues(TestTypeUnit),
);

export const TestTypeTable = pgTable(
  'test_type',
  {
    type_id: uuid().defaultRandom().primaryKey(),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    name: varchar({ length: 64 }).notNull(),
    unit: testTypeUnitEnum().default(TestTypeUnit.TIMES).notNull(),
    // Direction of improvement: a sprint time gets better as it drops.
    higher_is_better: boolean().default(true).notNull(),
    // Optional team benchmark the progression bands are measured against.
    target: decimal({ precision: 10, scale: 3 }),
    created_at,
    updated_at,
  },
  (table) => [
    // Ensure name is unique within a team
    uniqueIndex('team_test_type_name').on(table.team_id, table.name),
  ],
);

export const TestTypeRelations = relations(TestTypeTable, ({ one, many }) => ({
  team: one(TeamTable, {
    fields: [TestTypeTable.team_id],
    references: [TeamTable.team_id],
  }),
  results: many(TestResultTable),
  notes: many(TestNoteTable),
}));

export const TestResultTable = pgTable('test_result', {
  result_id: uuid().defaultRandom().primaryKey(),
  player_id: text()
    .notNull()
    .references(() => PlayerTable.id, { onDelete: 'cascade' }),
  type_id: uuid()
    .notNull()
    // Block deleting a test type that still has results (guarded in removeTestType).
    .references(() => TestTypeTable.type_id, { onDelete: 'restrict' }),
  result: decimal({ precision: 10, scale: 3 }).notNull(),
  date: date().notNull(),
  created_at,
  updated_at,
});

export const TestResultRelations = relations(TestResultTable, ({ one }) => ({
  player: one(PlayerTable, {
    fields: [TestResultTable.player_id],
    references: [PlayerTable.id],
  }),
  type: one(TestTypeTable, {
    fields: [TestResultTable.type_id],
    references: [TestTypeTable.type_id],
  }),
}));

/** A coach's development observation for a player, optionally tied to a test type. */
export const TestNoteTable = pgTable('test_note', {
  note_id: uuid().defaultRandom().primaryKey(),
  player_id: text()
    .notNull()
    .references(() => PlayerTable.id, { onDelete: 'cascade' }),
  // The focus area; the note outlives a deleted test type as a general note.
  type_id: uuid().references(() => TestTypeTable.type_id, {
    onDelete: 'set null',
  }),
  content: text().notNull(),
  // Score the player should reach at the next test of `type_id`.
  goal: decimal({ precision: 10, scale: 3 }),
  author_id: text().references(() => UserTable.id, { onDelete: 'set null' }),
  created_at,
  updated_at,
});

export const TestNoteRelations = relations(TestNoteTable, ({ one }) => ({
  player: one(PlayerTable, {
    fields: [TestNoteTable.player_id],
    references: [PlayerTable.id],
  }),
  type: one(TestTypeTable, {
    fields: [TestNoteTable.type_id],
    references: [TestTypeTable.type_id],
  }),
  author: one(UserTable, {
    fields: [TestNoteTable.author_id],
    references: [UserTable.id],
  }),
}));

export type TestType = typeof TestTypeTable.$inferSelect;
export type InsertTestType = typeof TestTypeTable.$inferInsert;
export type TestResult = typeof TestResultTable.$inferSelect;
export type InsertTestResult = typeof TestResultTable.$inferInsert;
export type TestNote = typeof TestNoteTable.$inferSelect;
export type InsertTestNote = typeof TestNoteTable.$inferInsert;
