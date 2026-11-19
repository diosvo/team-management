import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  enumValues,
  JERSEY_SIZES,
  PlayerPosition,
  SHORT_FORMS,
} from '@/utils/enum';

import { AttendanceTable } from './attendance';
import { LeagueTeamRosterTable } from './league';
import { MatchPlayerStatsTable } from './match';
import { TestResultTable } from './periodic-testing';
import { UserTable } from './user';

import { created_at, updated_at } from '../helpers';

export const playerPositionEnum = pgEnum(
  'player_position',
  enumValues(PlayerPosition),
);

export const jerseySizeEnum = pgEnum('jersey_size', JERSEY_SIZES);
export const shortFormEnum = pgEnum('short_form', SHORT_FORMS);

export const PlayerTable = pgTable(
  'player',
  {
    id: text()
      .notNull()
      .primaryKey()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    is_captain: boolean().default(false).notNull(),
    // `isJerseyNumberTaken` enforces it in the action layer instead.
    jersey_number: integer(),
    // Name printed on the back of the jersey; free text, may repeat.
    jersey_name: varchar({ length: 20 }),
    // Prefill the jersey order form.
    shirt_size: jerseySizeEnum(),
    short_size: jerseySizeEnum(),
    short_form: shortFormEnum(),
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
