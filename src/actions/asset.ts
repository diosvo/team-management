'use server';

import { ResponseFactory } from '@/utils/response';

import {
  deleteAsset,
  getAssets as getAction,
  insertAsset,
  updateAsset,
} from '@/db/asset';
import { UpsertAssetSchemaValues } from '@/schemas/asset';

import { withAuth } from './auth';
import { revalidate } from './cache';

export const getAssets = withAuth(
  async ({ team_id }) => await getAction(team_id)
);

export const upsertAsset = withAuth(
  async (user, asset_id: string, asset: UpsertAssetSchemaValues) => {
    const newData = { ...asset, team_id: user.team_id };

    try {
      if (asset_id) {
        await updateAsset(asset_id, newData);
      } else {
        await insertAsset(newData);
      }

      revalidate.assets();

      return ResponseFactory.success(
        `${asset_id ? 'Updated' : 'Added'} asset successfully`
      );
    } catch (error) {
      return ResponseFactory.fromError(error as Error);
    }
  }
);

export const removeAsset = withAuth(async (_, asset_id: string) => {
  try {
    await deleteAsset(asset_id);

    revalidate.assets();

    return ResponseFactory.success('Asset deleted successfully');
  } catch {
    return ResponseFactory.error('Failed to delete asset');
  }
});
