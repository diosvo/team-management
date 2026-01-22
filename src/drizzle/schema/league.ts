import { relations } from 'drizzle-orm';
import {
  date,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { LeagueStatus } from '@/utils/enum';
import { created_at, updated_at } from '../helpers';

import { MatchTable } from './match';
import { PlayerTable } from './player';
import { TeamTable } from './team';

export const leagueStatusEnum = pgEnum('league_status', LeagueStatus);

export const LeagueTable = pgTable('league', {
  league_id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 128 }).unique().notNull(),
  start_date: date().notNull(),
  end_date: date().notNull(),
  status: leagueStatusEnum().default(LeagueStatus.UPCOMING).notNull(),
  description: varchar({ length: 128 }),
  created_at,
  updated_at,
});

export const LeagueTeamTable = pgTable(
  'league_team',
  {
    league_id: uuid()
      .notNull()
      .references(() => LeagueTable.league_id, { onDelete: 'cascade' }),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    created_at,
    updated_at,
  },
  (table) => [primaryKey({ columns: [table.league_id, table.team_id] })],
);

export const LeagueTeamRosterTable = pgTable(
  'league_team_roster',
  {
    league_id: uuid()
      .notNull()
      .references(() => LeagueTable.league_id, { onDelete: 'cascade' }),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    player_id: text()
      .notNull()
      .references(() => PlayerTable.id, { onDelete: 'cascade' }),
    created_at,
    updated_at,
  },
  (table) => [
    primaryKey({ columns: [table.league_id, table.team_id, table.player_id] }),
  ],
);

export const LeagueRelations = relations(LeagueTable, ({ many }) => ({
  matches: many(MatchTable),
  league_teams: many(LeagueTeamTable),
  team_rosters: many(LeagueTeamRosterTable),
}));

export const LeagueTeamRelations = relations(
  LeagueTeamTable,
  ({ one, many }) => ({
    league: one(LeagueTable, {
      fields: [LeagueTeamTable.league_id],
      references: [LeagueTable.league_id],
    }),
    team: one(TeamTable, {
      fields: [LeagueTeamTable.team_id],
      references: [TeamTable.team_id],
    }),
    roster: many(LeagueTeamRosterTable),
  }),
);

export const LeagueTeamRosterRelations = relations(
  LeagueTeamRosterTable,
  ({ one }) => ({
    league: one(LeagueTable, {
      fields: [LeagueTeamRosterTable.league_id],
      references: [LeagueTable.league_id],
    }),
    team: one(TeamTable, {
      fields: [LeagueTeamRosterTable.team_id],
      references: [TeamTable.team_id],
    }),
    player: one(PlayerTable, {
      fields: [LeagueTeamRosterTable.player_id],
      references: [PlayerTable.id],
    }),
  }),
);

export type League = typeof LeagueTable.$inferSelect;
export type InsertLeague = typeof LeagueTable.$inferInsert;
export type InsertLeagueTeamRoster = typeof LeagueTeamRosterTable.$inferInsert;
