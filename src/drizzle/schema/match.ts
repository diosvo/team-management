import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  time,
  uuid,
} from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { LeagueTable } from './league';
import { LocationTable } from './location';
import { PlayerTable } from './player';
import { TeamTable } from './team';

export const MatchTable = pgTable(
  'match',
  {
    match_id: uuid().primaryKey().defaultRandom(),
    is_5x5: boolean().notNull(), // or 3x3
    league_id: uuid().references(() => LeagueTable.league_id, {
      onDelete: 'cascade',
    }), // Not null because it could be "Friendly" match
    location_id: uuid().references(() => LocationTable.location_id, {
      onDelete: 'set null',
    }),
    home_team: uuid()
      .notNull()
      .references(() => TeamTable.team_id),
    away_team: uuid()
      .notNull()
      .references(() => TeamTable.team_id),
    date: date().notNull(),
    time: time().notNull(),
    home_team_score: integer().default(0).notNull(),
    away_team_score: integer().default(0).notNull(),
    created_at,
    updated_at,
  },
  (table) => [
    check('diff_team', sql`${table.home_team} != ${table.away_team}`),
  ],
);

export const MatchPlayerStatsTable = pgTable(
  'match_player_stats',
  {
    match_id: uuid()
      .notNull()
      .references(() => MatchTable.match_id, { onDelete: 'cascade' }),
    player_id: text()
      .notNull()
      .references(() => PlayerTable.id, { onDelete: 'cascade' }),
    points_scored: integer().default(0).notNull(),
    rebounds: integer().default(0).notNull(),
    assists: integer().default(0).notNull(),
    steals: integer().default(0),
    blocks: integer().default(0),
    turnovers: integer().default(0),
    fouls: integer().default(0),
    minutes_played: integer().default(0),
    created_at,
    updated_at,
  },
  (table) => [primaryKey({ columns: [table.match_id, table.player_id] })],
);

export const MatchRelations = relations(MatchTable, ({ one, many }) => ({
  home_team: one(TeamTable, {
    relationName: 'home_team',
    fields: [MatchTable.home_team],
    references: [TeamTable.team_id],
  }),
  away_team: one(TeamTable, {
    relationName: 'away_team',
    fields: [MatchTable.away_team],
    references: [TeamTable.team_id],
  }),
  league: one(LeagueTable, {
    fields: [MatchTable.league_id],
    references: [LeagueTable.league_id],
  }),
  location: one(LocationTable, {
    fields: [MatchTable.location_id],
    references: [LocationTable.location_id],
  }),
  player_stats: many(MatchPlayerStatsTable),
}));

export const MatchPlayerStatsRelations = relations(
  MatchPlayerStatsTable,
  ({ one }) => ({
    match: one(MatchTable, {
      fields: [MatchPlayerStatsTable.match_id],
      references: [MatchTable.match_id],
    }),
    player: one(PlayerTable, {
      fields: [MatchPlayerStatsTable.player_id],
      references: [PlayerTable.id],
    }),
  }),
);

export type Match = typeof MatchTable.$inferSelect;
export type InsertMatch = typeof MatchTable.$inferInsert;
