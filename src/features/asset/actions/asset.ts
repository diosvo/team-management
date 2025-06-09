'use server';

import { NullishAsset } from '@/drizzle/schema';

import { getTeam } from '@/features/team/actions/team';

import { getAssets as getAction } from '../db/asset';

export async function getAssets(): Promise<NullishAsset> {
  const team = await getTeam();
  if (!team) return null;

  return await getAction(team.team_id);
}
