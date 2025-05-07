import { eq } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/drizzle';
import { Player, PlayerTable } from '@/drizzle/schema/player';
import logger from '@/lib/logger';

export const getPlayerByUserId = cache(async (user_id: string) => {
  try {
    return await db.query.PlayerTable.findFirst({
      where: eq(PlayerTable.user_id, user_id),
    });
  } catch (error) {
    logger.error('Failed to fetch player information');
    return null;
  }
});

export async function insertPlayer(player: {
  user_id: string;
  jersey_number?: number;
  position?: string;
  height_cm?: number;
  weight_kg?: number;
  dominant_foot?: string;
}) {
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
