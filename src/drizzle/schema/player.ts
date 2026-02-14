import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
} from 'drizzle-orm/pg-core';

import { PlayerPosition } from '@/utils/enum';
import { created_at, updated_at } from '../helpers';

import { AttendanceTable } from './attendance';
import { LeagueTeamRosterTable } from './league';
import { MatchPlayerStatsTable } from './match';
import { TestResultTable } from './periodic-testing';
import { UserTable } from './user';

export const playerPositionEnum = pgEnum('player_position', PlayerPosition);

export const PlayerTable = pgTable(
  'player',
  {
    id: text()
      .notNull()
      .primaryKey()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    is_captain: boolean().default(false).notNull(),
    jersey_number: integer().unique(),
    position: playerPositionEnum().default(PlayerPosition.UNKNOWN),
    height: integer(),
    weight: integer(),
    created_at,
    updated_at,
  },
  (table) => [
    check('jersey_number', sql`${table.jersey_number} BETWEEN 0 AND 99`),
    check('height', sql`${table.height} BETWEEN 0 AND 200`),
    check('weight', sql`${table.weight} BETWEEN 0 AND 100`),
  ],
);

export const PlayerRelations = relations(PlayerTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [PlayerTable.id],
    references: [UserTable.id],
  }),
  league_participations: many(LeagueTeamRosterTable),
  match_stats: many(MatchPlayerStatsTable),
  test_results: many(TestResultTable),
  attendance: many(AttendanceTable),
}));

export type Player = typeof PlayerTable.$inferSelect;
export type InsertPlayer = typeof PlayerTable.$inferInsert;
