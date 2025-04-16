import { cache } from 'react';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

export const getTeam = cache(async () => {
  try {
    const [team] = await db.select().from(TeamTable).limit(1);
    return team;
  } catch {
    logger.error('Team may not exist');
    return null;
  }
});
