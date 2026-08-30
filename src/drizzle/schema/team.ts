import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { AssetTable } from './asset';
import { LeagueTeamTable } from './league';
import { MatchTable } from './match';
import { TestTypeTable } from './periodic-testing';
import { UserTable } from './user';
import { UserTeamTable } from './user-team';

export const TeamTable = pgTable(
  'team',
  {
    team_id: uuid().primaryKey().defaultRandom(),
    is_default: boolean().default(false).notNull(),
    // Opponent-only record: carries no members and is hidden from the
    // team-management UIs, which read the club's own team.
    is_external: boolean().default(false).notNull(),
    name: varchar({ length: 128 }).notNull(),
    email: varchar({ length: 128 }).unique(),
    establish_year: integer().default(new Date().getFullYear()).notNull(),
    image: text(),
    // The team's rule document. Its own timestamp, so renaming the team or
    // swapping its logo does not read as a revision of the rules.
    rule_content: text(),
    rule_updated_at: timestamp('rule_updated_at', { withTimezone: true }),
    created_at,
    updated_at,
  },
  (table) => [
    check(
      'establish_year',
      sql`${table.establish_year} BETWEEN 2000 AND date_part('year', CURRENT_DATE)`,
    ),
    // The club's own team is never an opponent
    check(
      'default_team_not_external',
      sql`NOT (${table.is_default} AND ${table.is_external})`,
    ),
    // Ensure that there is only one default team
    uniqueIndex('default_team')
      .on(table.is_default)
      .where(sql`${table.is_default} = true`),
  ],
);

export const TeamRelations = relations(TeamTable, ({ many }) => ({
  users: many(UserTable),
  memberships: many(UserTeamTable),
  league_teams: many(LeagueTeamTable),
  home_matches: many(MatchTable, {
    relationName: 'home_team',
  }),
  away_matches: many(MatchTable, {
    relationName: 'away_team',
  }),
  assets: many(AssetTable),
  test_types: many(TestTypeTable),
}));

export type Team = typeof TeamTable.$inferSelect;
export type NullishTeam = Nullish<Team>;
export type InsertTeam = typeof TeamTable.$inferInsert;

/** The rule document, now stored on `team` rather than in its own table. */
export type TeamRule = Pick<Team, 'rule_content' | 'rule_updated_at'>;
export type NullishTeamRule = Nullish<TeamRule>;
