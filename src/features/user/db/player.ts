import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertPlayer, PlayerTable } from '@/drizzle/schema/player';

export async function insertPlayer(player: InsertPlayer) {
  try {
    return await db.insert(PlayerTable).values(player);
  } catch (error) {
    return null;
  }
}

export async function updatePlayer(player: InsertPlayer) {
  try {
    return await db
      .update(PlayerTable)
      .set(player)
      .where(eq(PlayerTable.user_id, player.user_id));
  } catch (error) {
    throw error;
  }
}
