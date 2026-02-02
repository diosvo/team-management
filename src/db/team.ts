import { eq } from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

import { getCacheTag } from '@/actions/cache';

export async function getOtherTeams() {
  'use cache';
  cacheTag(getCacheTag.opponents());

  try {
    return await db.query.TeamTable.findMany({
      where: eq(TeamTable.is_default, false),
    });
  } catch {
    return [];
  }
}
