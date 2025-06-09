import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema';

import logger from '@/lib/logger';

import { CACHE_REVALIDATION_TIME } from '@/utils/constant';
import { teamCacheKey, teamCacheTag } from './cache';

export async function getTeam() {
  return await unstable_cache(
    async () => {
      try {
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
      tags: [teamCacheTag()],
      revalidate: CACHE_REVALIDATION_TIME,
    }
  )();
}
