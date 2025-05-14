import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { Player, PlayerTable } from '@/drizzle/schema/player';
import logger from '@/lib/logger';

export async function insertPlayer(player: Player) {
  try {
    await db.insert(PlayerTable).values(player);
    return { error: false };
  } catch (error) {
    logger.error('Failed to insert player information', error);
    return { error: true };
  }
}

export async function updatePlayer(user_id: string, player: Partial<Player>) {
  try {
    await db
      .update(PlayerTable)
      .set(player)
      .where(eq(PlayerTable.user_id, user_id));
    return { error: false };
  } catch (error) {
    logger.error('Failed to update player information', error);
    return { error: true };
  }
}
