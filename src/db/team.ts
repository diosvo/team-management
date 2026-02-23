import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

export async function getOtherTeams() {
  'use cache';

  try {
    return await db.query.TeamTable.findMany({
      where: eq(TeamTable.is_default, false),
    });
  } catch {
    return [];
  }
}
