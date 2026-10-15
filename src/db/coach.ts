import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable, type InsertCoach } from '@/drizzle/schema/coach';

export async function insertCoach(coach: InsertCoach) {
  return await db.insert(CoachTable).values(coach);
}

/**
 * Creates the coach row, or updates it when one already exists — a user
 * switching to the coach role may not have a row yet.
 */
export async function upsertCoach(coach: InsertCoach) {
  return await db
    .insert(CoachTable)
    .values(coach)
    .onConflictDoUpdate({ target: CoachTable.id, set: coach });
}

export async function deleteCoach(coach_id: string) {
  return await db.delete(CoachTable).where(eq(CoachTable.id, coach_id));
}
