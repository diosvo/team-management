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
    // Keep `date` on the row for fast queries, while the composite FK ensures
    // it matches the session and reschedules cascade correctly. NULL session_id
    // skips the check so leave requests work.
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
    // One record per player per session.
    uniqueIndex('unique_player_per_session')
      .on(table.player_id, table.session_id)
      .where(sql`${table.session_id} IS NOT NULL`),
    // Leave requests use one record per player per date.
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
