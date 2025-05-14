import { db } from '@/drizzle';
import { CoachTable, InsertCoach } from '@/drizzle/schema/coach';

import logger from '@/lib/logger';

export async function insertCoach(coach: InsertCoach) {
  try {
    return await db.insert(CoachTable).values(coach);
  } catch (error) {
    logger.error(error);
    return null;
  }
}
