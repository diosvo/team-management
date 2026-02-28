import { relations } from 'drizzle-orm';
import { date, pgEnum, pgTable, text, time, uuid } from 'drizzle-orm/pg-core';

import { SessionStatus } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { AttendanceTable } from './attendance';
import { CoachTable } from './coach';
import { LocationTable } from './location';
import { TeamTable } from './team';

export const sessionStatusEnum = pgEnum('session_status', SessionStatus);

export const TrainingSessionTable = pgTable('training_session', {
  session_id: uuid().primaryKey().defaultRandom(),
  team_id: uuid()
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  coach_id: text().references(() => CoachTable.id, { onDelete: 'set null' }),
  location_id: uuid().references(() => LocationTable.location_id, {
    onDelete: 'set null',
  }),
  date: date().notNull(),
  start_time: time().notNull(),
  end_time: time().notNull(),
  status: sessionStatusEnum().notNull().default(SessionStatus.SCHEDULED),
  created_at,
  updated_at,
});

export const TrainingSessionRelations = relations(
  TrainingSessionTable,
  ({ one, many }) => ({
    team: one(TeamTable, {
      fields: [TrainingSessionTable.team_id],
      references: [TeamTable.team_id],
    }),
    location: one(LocationTable, {
      fields: [TrainingSessionTable.location_id],
      references: [LocationTable.location_id],
    }),
    coach: one(CoachTable, {
      fields: [TrainingSessionTable.coach_id],
      references: [CoachTable.id],
    }),
    attendances: many(AttendanceTable),
  }),
);

export type TrainingSession = typeof TrainingSessionTable.$inferSelect;
export type InsertTrainingSession = typeof TrainingSessionTable.$inferInsert;
