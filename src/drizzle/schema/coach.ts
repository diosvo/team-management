import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

import { CoachPosition } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { UserTable } from './user';

export const coachPositionEnum = pgEnum('coach_position', CoachPosition);

export const CoachTable = pgTable('coach', {
  id: text()
    .notNull()
    .primaryKey()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
  position: coachPositionEnum().default(CoachPosition.UNKNOWN).notNull(),
  created_at,
  updated_at,
});

export const CoachRelations = relations(CoachTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [CoachTable.id],
    references: [UserTable.id],
  }),
}));

export type Coach = typeof CoachTable.$inferSelect;
export type InsertCoach = typeof CoachTable.$inferInsert;
