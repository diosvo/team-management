import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertPlayer, PlayerTable } from '@/drizzle/schema/player';

export async function insertPlayer(player: InsertPlayer) {
  return await db.insert(PlayerTable).values(player);
}

export async function updatePlayer(player: InsertPlayer) {
  return await db
    .update(PlayerTable)
    .set(player)
    .where(eq(PlayerTable.id, player.id));
}
