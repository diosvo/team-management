import db from '@/drizzle';
import { CoachTable, type InsertCoach } from '@/drizzle/schema/coach';

export async function insertCoach(coach: InsertCoach) {
  return await db.insert(CoachTable).values(coach);
}
