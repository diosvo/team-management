'server-only';

import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertPlayer, PlayerTable } from '@/drizzle/schema/player';

export async function insertPlayer(player: InsertPlayer) {
  try {
    return await db.insert(PlayerTable).values(player);
  } catch (error) {
    throw error;
  }
}

export async function updatePlayer(player: InsertPlayer) {
  try {
    return await db
      .update(PlayerTable)
      .set(player)
      .where(eq(PlayerTable.id, player.id));
  } catch (error) {
    throw error;
  }
}
