'use server';

import { cache } from 'react';

import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';
import logger from '@/lib/logger';

export const getTeam = cache(async () => {
  logger.info('💥 Fetching default team.');

  try {
    return await db.query.TeamTable.findFirst({
      where: eq(TeamTable.is_default, true),
    });
  } catch {
    return null;
  }
});
