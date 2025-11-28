import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { MatchTable } from './match';

export const LocationTable = pgTable('location', {
  location_id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 128 }).notNull(),
  address: varchar({ length: 256 }).notNull(),
  created_at,
  updated_at,
});

export const LocationRelations = relations(LocationTable, ({ many }) => ({
  matches: many(MatchTable),
}));

export type Location = typeof LocationTable.$inferSelect;
export type InsertLocation = typeof LocationTable.$inferInsert;
