import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { AssetTable } from '@/drizzle/schema';

export async function getAssets(team_id: string) {
  try {
    return await db.query.AssetTable.findFirst({
      where: eq(AssetTable.team_id, team_id),
    });
  } catch {
    return null;
  }
}
