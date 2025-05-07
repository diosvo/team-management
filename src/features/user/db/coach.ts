import { eq } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/drizzle';
import { CoachTable } from '@/drizzle/schema/coach';
import logger from '@/lib/logger';

export const getCoachByUserId = cache(async (user_id: string) => {
  try {
    return await db.query.CoachTable.findFirst({
      where: eq(CoachTable.user_id, user_id),
    });
  } catch (error) {
    logger.error('Failed to fetch coach information');
    return null;
  }
});
