import 'server-only';

import { unstable_cache } from 'next/cache';

import { eq } from 'drizzle-orm';

import logger from '@/lib/logger';
import { CACHE_REVALIDATION_TIME } from '@/utils/constant';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

import { teamCacheKey, teamCacheTag } from './cache';

export const getTeam = unstable_cache(
  async () => {
    logger.info('💥 Getting default team...');

    try {
      return await db.query.TeamTable.findFirst({
        where: eq(TeamTable.is_default, true),
      });
    } catch (error) {
      logger.error('🆘 Failed to get team:', error);
      return null;
    }
  },
  [teamCacheKey()],
  {
    revalidate: CACHE_REVALIDATION_TIME,
    tags: [teamCacheTag()],
  }
);
