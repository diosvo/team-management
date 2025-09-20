'server-only';

import { eq } from 'drizzle-orm';

import logger from '@/lib/logger';

import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

export async function getTeam() {
  logger.info('⭐️ Get default team...');

  try {
    return await db.query.TeamTable.findFirst({
      where: eq(TeamTable.is_default, true),
    });
  } catch (error) {
    logger.error('🆘 Failed to get team:', error);
    return null;
  }
}
