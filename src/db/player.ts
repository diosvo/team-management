import { and, eq, inArray, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertPlayer, PlayerTable } from '@/drizzle/schema/player';
import { UserTable } from '@/drizzle/schema/user';

export async function isJerseyNumberTaken(
  team_id: string,
  jersey_number: number,
  exclude_player_id: string,
) {
  const conflicts = await db
    .select({ id: PlayerTable.id })
    .from(PlayerTable)
    .leftJoin(UserTable, eq(UserTable.id, PlayerTable.id))
    .where(
      and(
        eq(UserTable.team_id, team_id),
        eq(PlayerTable.jersey_number, jersey_number),
        ne(PlayerTable.id, exclude_player_id),
      ),
    )
    .limit(1);

  return conflicts.length > 0;
}

/**
 * Narrows `player_ids` to those that are players on `team_id`. The database
 * cannot express this — `player` has no team of its own, it inherits one from
 * `user` — so callers registering players against a team must check it here.
 */
export async function getTeamPlayerIds(
  team_id: string,
  player_ids: Array<string>,
): Promise<Array<string>> {
  if (player_ids.length === 0) return [];

  const players = await db
    .select({ id: PlayerTable.id })
    .from(PlayerTable)
    .innerJoin(UserTable, eq(UserTable.id, PlayerTable.id))
    .where(
      and(
        eq(UserTable.team_id, team_id),
        inArray(PlayerTable.id, player_ids),
      ),
    );

  return players.map(({ id }) => id);
}

export async function insertPlayer(player: InsertPlayer) {
  return await db.insert(PlayerTable).values(player);
}

export async function updatePlayer(player: InsertPlayer) {
  return await db
    .update(PlayerTable)
    .set(player)
    .where(eq(PlayerTable.id, player.id));
}
