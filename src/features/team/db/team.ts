import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { TeamTable } from '@/drizzle/schema';

export async function getTeam() {
  try {
    return await db.query.TeamTable.findFirst({
      where: eq(TeamTable.is_default, true),
    });
  } catch {
    return null;
  }
}
