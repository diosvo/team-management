'server-only';

import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable, InsertCoach } from '@/drizzle/schema/coach';

export async function insertCoach(coach: InsertCoach) {
  try {
    return await db.insert(CoachTable).values(coach);
  } catch (error) {
    throw error;
  }
}

export async function updateCoach(coach: InsertCoach) {
  try {
    return await db
      .update(CoachTable)
      .set(coach)
      .where(eq(CoachTable.id, coach.id));
  } catch (error) {
    throw error;
  }
}
