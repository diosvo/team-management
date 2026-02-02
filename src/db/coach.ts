import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable, InsertCoach } from '@/drizzle/schema/coach';

export async function insertCoach(coach: InsertCoach) {
  return await db.insert(CoachTable).values(coach);
}

export async function updateCoach(coach: InsertCoach) {
  return await db
    .update(CoachTable)
    .set(coach)
    .where(eq(CoachTable.id, coach.id));
}
