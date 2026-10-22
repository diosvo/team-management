import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  uuid,
} from 'drizzle-orm/pg-core';

import { enumValues, MatchStatus } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { LeagueTable } from './league';
import { LocationTable } from './location';
import { PlayerTable } from './player';
import { TeamTable } from './team';

export const matchStatusEnum = pgEnum('match_status', enumValues(MatchStatus));

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
    // A team with match history is history: deleting it would silently rewrite
    // the record, so the delete is blocked and `removeTeam` explains why.
    home_team: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'restrict' }),
    away_team: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'restrict' }),
    date: date().notNull(),
    time: time().notNull(),
    status: matchStatusEnum().notNull().default(MatchStatus.SCHEDULED),
    home_team_score: integer().default(0).notNull(),
    away_team_score: integer().default(0).notNull(),
    created_at,
    updated_at,
  },
  (table) => [
    check('diff_team', sql`${table.home_team} != ${table.away_team}`),
    // Keeps the point of `status` intact: a fixture that was never played
    // cannot carry a score, so 0-0 always means a real 0-0 draw.
    check(
      'unplayed_match_has_no_score',
      sql`${table.status} = 'completed' OR (${table.home_team_score} = 0 AND ${table.away_team_score} = 0)`,
    ),
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
    // The team the player turned out for in this match. Recorded per row
    // because a player's current team can change; without it, historical box
    // scores would silently re-attribute to wherever the player is today.
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
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
    team: one(TeamTable, {
      fields: [MatchPlayerStatsTable.team_id],
      references: [TeamTable.team_id],
    }),
  }),
);

export type Match = typeof MatchTable.$inferSelect;
export type InsertMatch = typeof MatchTable.$inferInsert;
