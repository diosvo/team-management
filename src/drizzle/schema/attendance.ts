import { relations, sql } from 'drizzle-orm';
import {
  date,
  foreignKey,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { AttendanceStatus, enumValues } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { PlayerTable } from './player';
import { TrainingSessionTable } from './training';

export const attendanceStatusEnum = pgEnum(
  'attendance_status',
  enumValues(AttendanceStatus),
);

export const AttendanceTable = pgTable(
  'attendance',
  {
    attendance_id: uuid().primaryKey().defaultRandom(),
    // The owning team comes from `player` -> `user`.`team_id`; storing it here
    // too gave two paths to the same answer with nothing keeping them equal.
    player_id: text()
      .notNull()
      .references(() => PlayerTable.id, { onDelete: 'cascade' }),
    session_id: uuid(),
    status: attendanceStatusEnum().notNull().default(AttendanceStatus.ON_TIME),
    date: date().notNull(),
    reason: varchar({ length: 128 }),
    created_at,
    updated_at,
  },
  (table) => [
    // `date` stays on the row so attendance can be listed and aggregated
    // without joining `training_session`, but the composite key makes it
    // impossible for it to disagree with the session it points at:
    // a mismatched pair has no parent row, and rescheduling a session
    // cascades the new date down. Postgres skips the check when `session_id`
    // is NULL (MATCH SIMPLE), which is exactly what leave requests need.
    foreignKey({
      columns: [table.session_id, table.date],
      foreignColumns: [
        TrainingSessionTable.session_id,
        TrainingSessionTable.date,
      ],
      name: 'attendance_session_id_date_fk',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    // One record per player per session, so a player can be tracked
    // separately across two sessions held on the same day.
    uniqueIndex('unique_player_per_session')
      .on(table.player_id, table.session_id)
      .where(sql`${table.session_id} IS NOT NULL`),
    // Session-less records (leave requests) have no session to key off, so
    // they fall back to one per player per date.
    uniqueIndex('unique_player_per_date')
      .on(table.player_id, table.date)
      .where(sql`${table.session_id} IS NULL`),
  ],
);

export const AttendanceRelations = relations(AttendanceTable, ({ one }) => ({
  player: one(PlayerTable, {
    fields: [AttendanceTable.player_id],
    references: [PlayerTable.id],
  }),
  training_session: one(TrainingSessionTable, {
    fields: [AttendanceTable.session_id],
    references: [TrainingSessionTable.session_id],
  }),
}));

export type Attendance = typeof AttendanceTable.$inferSelect;
export type InsertAttendance = typeof AttendanceTable.$inferInsert;
