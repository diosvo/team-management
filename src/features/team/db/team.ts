import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

import logger from '@/lib/logger';
import { CACHE_REVALIDATION_TIME } from '@/utils/constant';

import { teamCacheKey } from './cache';

export const getTeam = unstable_cache(
  async () => {
    try {
      // FIXME
      logger.info('💥 Fetching default team.');
      return await db.query.TeamTable.findFirst({
        where: eq(TeamTable.is_default, true),
      });
    } catch (error) {
      logger.error('Failed to fetch default team:', error);
      return null;
    }
  },
  [teamCacheKey()],
  {
    tags: [teamCacheKey()],
    revalidate: CACHE_REVALIDATION_TIME,
  }
);
