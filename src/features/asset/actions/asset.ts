'use server';

import { Asset, NullishAsset } from '@/drizzle/schema/asset';
import { Response, ResponseFactory } from '@/utils/response';

import { getTeam } from '@/features/team/actions/team';

import {
  getAssets as getAction,
  getAsset,
  insertAsset,
  updateAsset,
} from '../db/asset';
import { revalidateAssetsPath } from '../db/cache';

export async function getAssets(): Promise<NullishAsset> {
  const team = await getTeam();
  if (!team) return null;

  return await getAction(team.team_id);
}

export async function upsertAsset(asset: Asset): Promise<Response> {
  const team = await getTeam();

  if (!team) {
    return ResponseFactory.error('Team not found');
  }

  const { asset_id, ...rest } = asset;

  try {
    const existingAsset = await getAsset(asset_id);

    if (existingAsset) {
      await updateAsset(asset);
    } else {
      await insertAsset({ ...rest, team_id: team.team_id });
    }

    revalidateAssetsPath();

    return ResponseFactory.success('Asset updated successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
