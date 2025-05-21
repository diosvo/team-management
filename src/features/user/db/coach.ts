import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { CoachTable, InsertCoach } from '@/drizzle/schema/coach';

import logger from '@/lib/logger';

export async function updateCoach(coach: InsertCoach) {
  try {
    return await db
      .update(CoachTable)
      .set(coach)
      .where(eq(CoachTable.user_id, coach.user_id));
  } catch (error) {
    logger.error(error);
    return null;
  }
}

export async function insertCoach(coach: InsertCoach) {
  try {
    return await db.insert(CoachTable).values(coach);
  } catch (error) {
    logger.error(error);
    return null;
  }
}
