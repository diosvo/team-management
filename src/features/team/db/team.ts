import { unstable_cache } from 'next/cache';

import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema';

export const getTeam = unstable_cache(
  async () => {
    try {
      return await db.query.TeamTable.findFirst({
        where: eq(TeamTable.is_default, true),
      });
    } catch (error) {
      throw error;
    }
  },
  [],
  {
    tags: ['team'],
    revalidate: 3600,
  }
);
