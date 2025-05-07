import { cache } from 'react';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema';
import logger from '@/lib/logger';
import { eq } from 'drizzle-orm';

export const getTeam = cache(async () => {
  try {
    return await db.query.TeamTable.findFirst({
      where: eq(TeamTable.is_default, true),
    });
  } catch {
    logger.error('Team may not exist');
    return null;
  }
});
