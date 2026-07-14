import { and, asc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertTeam, TeamTable } from '@/drizzle/schema/team';
import { UpsertTeamSchemaValues } from '@/schemas/team';

export async function getTeams() {
  try {
    return await db.query.TeamTable.findMany({
      where: eq(TeamTable.is_default, false),
      orderBy: asc(TeamTable.name),
    });
  } catch {
    return [];
  }
}

export async function insertTeam(team: InsertTeam) {
  const [row] = await db
    .insert(TeamTable)
    .values({ ...team, is_default: false })
    .returning({ team_id: TeamTable.team_id });
  return row;
}

export async function updateTeam(
  team_id: string,
  team: Partial<UpsertTeamSchemaValues>,
) {
  return await db
    .update(TeamTable)
    .set(team)
    .where(
      and(eq(TeamTable.team_id, team_id), eq(TeamTable.is_default, false)),
    );
}

export async function deleteTeam(team_id: string) {
  return await db
    .delete(TeamTable)
    .where(
      and(eq(TeamTable.team_id, team_id), eq(TeamTable.is_default, false)),
    );
}
