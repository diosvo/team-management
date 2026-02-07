import { relations } from 'drizzle-orm';
import {
  date,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { AttendanceStatus } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { PlayerTable } from './player';
import { TeamTable } from './team';

export const attendanceStatusEnum = pgEnum(
  'attendance_status',
  AttendanceStatus,
);

export const AttendanceTable = pgTable(
  'attendance',
  {
    attendance_id: uuid().primaryKey().defaultRandom(),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    player_id: text()
      .notNull()
      .references(() => PlayerTable.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum().notNull().default(AttendanceStatus.ON_TIME),
    date: date().notNull(),
    reason: varchar({ length: 128 }),
    created_at,
    updated_at,
  },
  (table) => [
    // Ensure one attendance record per player per date
    uniqueIndex('unique_player_per_date').on(table.player_id, table.date),
  ],
);

export const AttendanceRelations = relations(AttendanceTable, ({ one }) => ({
  player: one(PlayerTable, {
    fields: [AttendanceTable.player_id],
    references: [PlayerTable.id],
  }),
  team: one(TeamTable, {
    fields: [AttendanceTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export type Attendance = typeof AttendanceTable.$inferSelect;
export type InsertAttendance = typeof AttendanceTable.$inferInsert;
