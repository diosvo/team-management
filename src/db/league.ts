import { and, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import type { User } from '@/drizzle/schema';
import {
  type InsertLeague,
  LeagueTable,
  LeagueTeamRosterTable,
  LeagueTeamTable,
} from '@/drizzle/schema/league';
import type { UpsertLeagueSchemaValues } from '@/schemas/league';
import { deriveDateStatus } from '@/utils/helper';

export async function getLeagues() {
  try {
    const leagues = await db.query.LeagueTable.findMany({
      orderBy: desc(LeagueTable.end_date),
      with: {
        team_rosters: {
          columns: { league_id: true },
        },
        achievements: {
          columns: { type: true },
        },
      },
    });

    return leagues.map((league) => {
      const { team_rosters, achievements, ...rest } = league;

      return {
        ...rest,
        status: deriveDateStatus(league.start_date, league.end_date),
        player_count: team_rosters.length,
        achievement_type: achievements.map((achievement) => achievement.type),
      };
    });
  } catch {
    return [];
  }
}

export async function getPlayersInLeague(
  team_id: string,
  league_id: string,
): Promise<Array<User>> {
  try {
    const results = await db.query.LeagueTeamRosterTable.findMany({
      columns: {},
      where: and(
        eq(LeagueTeamRosterTable.team_id, team_id),
        eq(LeagueTeamRosterTable.league_id, league_id),
      ),
      with: {
        player: {
          with: {
            user: true,
          },
        },
      },
    });

    return results.map(({ player }) => player.user);
  } catch {
    return [];
  }
}

export async function getLeagueById(league_id: string) {
  const league = await db.query.LeagueTable.findFirst({
    where: eq(LeagueTable.league_id, league_id),
  });

  if (!league) return undefined;

  return {
    ...league,
    status: deriveDateStatus(league.start_date, league.end_date),
  };
}

export async function insertLeague(league: InsertLeague) {
  return await db.insert(LeagueTable).values(league).returning({
    league_id: LeagueTable.league_id,
  });
}

export async function updateLeague(
  league_id: string,
  league: UpsertLeagueSchemaValues,
) {
  return await db
    .update(LeagueTable)
    .set(league)
    .where(eq(LeagueTable.league_id, league_id));
}

export async function deleteLeague(league_id: string) {
  return await db
    .delete(LeagueTable)
    .where(eq(LeagueTable.league_id, league_id));
}

/**
 * Enters a team into a league. Roster rows carry a composite FK to
 * `league_team`, so this pair has to exist before any player is registered.
 */
export async function registerTeamInLeague(league_id: string, team_id: string) {
  return await db
    .insert(LeagueTeamTable)
    .values({ league_id, team_id })
    .onConflictDoNothing();
}

export async function addPlayerToLeagueRoster(
  team_id: string,
  league_id: string,
  player_id: string,
) {
  return await db.insert(LeagueTeamRosterTable).values({
    team_id,
    league_id,
    player_id,
  });
}

export async function removePlayerFromLeagueRoster(
  team_id: string,
  league_id: string,
  player_id: string,
) {
  return await db
    .delete(LeagueTeamRosterTable)
    .where(
      and(
        eq(LeagueTeamRosterTable.team_id, team_id),
        eq(LeagueTeamRosterTable.league_id, league_id),
        eq(LeagueTeamRosterTable.player_id, player_id),
      ),
    );
}
