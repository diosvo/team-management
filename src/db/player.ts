import { and, eq, ne } from 'drizzle-orm';

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
    );

  return conflicts.length > 0;
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
