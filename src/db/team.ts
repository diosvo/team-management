import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

export async function getOtherTeams() {
  try {
    return await db.query.TeamTable.findMany({
      where: eq(TeamTable.is_default, false),
    });
  } catch {
    return [];
  }
}
