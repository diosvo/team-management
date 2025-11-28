import { and, count, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { UserTable } from '@/drizzle/schema';
import {
  InsertLeague,
  LeagueTable,
  LeagueTeamRosterTable,
} from '@/drizzle/schema/league';

import { UpsertLeagueSchemaValues } from '@/schemas/league';

export async function getLeagues() {
  // After all leagues have been updated, pass an argument to allow filtering (support Add match result with Upcoming/Ongoing status only)

  try {
    return db.query.LeagueTable.findMany({
      orderBy: (leagues, { asc }) => [asc(leagues.end_date)],
    });
  } catch {
    return [];
  }
}

export async function getLeague(league_id: string) {
  try {
    return await db
      .select({
        team_id: LeagueTeamRosterTable.team_id,
        noPlayers: count(LeagueTeamRosterTable.player_id),
      })
      .from(LeagueTeamRosterTable)
      .where(eq(LeagueTeamRosterTable.league_id, league_id))
      .groupBy(LeagueTeamRosterTable.team_id);
  } catch {
    return null;
  }
}

export async function insertLeague(league: InsertLeague) {
  try {
    return await db.insert(LeagueTable).values(league).returning({
      league_id: LeagueTable.league_id,
    });
  } catch (error) {
    throw error;
  }
}

export async function updateLeague(
  league_id: string,
  league: UpsertLeagueSchemaValues,
) {
  try {
    return await db
      .update(LeagueTable)
      .set(league)
      .where(eq(LeagueTable.league_id, league_id));
  } catch (error) {
    throw error;
  }
}

export async function deleteLeague(league_id: string) {
  try {
    return await db
      .delete(LeagueTable)
      .where(eq(LeagueTable.league_id, league_id));
  } catch {
    return null;
  }
}

export async function addPlayerToLeagueRoster(
  team_id: string,
  league_id: string,
  player_id: string,
) {
  const player = await db.query.UserTable.findFirst({
    where: and(eq(UserTable.team_id, team_id), eq(UserTable.id, player_id)),
  });

  if (!player) {
    throw new Error('Player does not belong to this team');
  }

  return await db.insert(LeagueTeamRosterTable).values({
    league_id,
    team_id,
    player_id,
  });
}
