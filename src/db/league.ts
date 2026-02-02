import { and, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import {
  InsertLeague,
  LeagueTable,
  LeagueTeamRosterTable,
} from '@/drizzle/schema/league';

import { User } from '@/drizzle/schema';
import { UpsertLeagueSchemaValues } from '@/schemas/league';

export async function getLeagues() {
  // After all leagues have been updated, pass an argument to allow filtering (support Add match result with Upcoming/Ongoing status only)

  try {
    const leagues = await db.query.LeagueTable.findMany({
      orderBy: desc(LeagueTable.end_date),
      with: {
        team_rosters: {
          columns: { league_id: true },
        },
      },
    });

    return leagues.map((league) => ({
      ...league,
      player_count: league.team_rosters.length,
    }));
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

export async function insertLeague(league: InsertLeague) {
  return await db.insert(LeagueTable).values(league);
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
