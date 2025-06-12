'use server';

import { Response, ResponseFactory } from '@/utils/response';

import { getTeam } from '@/features/team/actions/team';

import { Asset } from '@/drizzle/schema';
import {
  deleteAsset,
  getAssets as getAction,
  getAsset,
  insertAsset,
  updateAsset,
} from '../db/asset';
import { revalidateAssetsPath } from '../db/cache';
import { UpsertAssetSchemaValues } from '../schemas/asset';

export async function getAssets(): Promise<{
  stats: {
    total_items: number;
    need_replacement: number;
  };
  data: Array<Asset>;
}> {
  const team = await getTeam();
  if (!team)
    return {
      stats: { total_items: 0, need_replacement: 0 },
      data: [],
    };

  const assets = await getAction(team.team_id);
  return assets;
}

export async function upsertAsset(
  asset_id: string,
  asset: UpsertAssetSchemaValues
): Promise<Response> {
  const team = await getTeam();

  if (!team) {
    return ResponseFactory.error('Team not found');
  }

  try {
    const existingAsset = await getAsset(asset_id);

    if (existingAsset) {
      await updateAsset(asset_id, { ...asset, team_id: team.team_id });
    } else {
      await insertAsset({ ...asset, team_id: team.team_id });
    }

    revalidateAssetsPath();

    return ResponseFactory.success('Asset updated successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function removeAsset(asset_id: string): Promise<Response> {
  try {
    await deleteAsset(asset_id);

    revalidateAssetsPath();

    return ResponseFactory.success('Asset deleted successfully');
  } catch {
    return ResponseFactory.error('Failed to delete asset');
  }
}
