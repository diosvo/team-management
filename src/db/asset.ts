import { cacheTag } from 'next/cache';

import { desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { AssetTable, InsertAsset } from '@/drizzle/schema/asset';

import { getCacheTag } from '@/actions/cache';
import { AssetCondition } from '@/utils/enum';

export async function getAssets(team_id: string) {
  'use cache';
  cacheTag(getCacheTag.assets());

  try {
    const assets = await db.query.AssetTable.findMany({
      where: eq(AssetTable.team_id, team_id),
      orderBy: desc(AssetTable.updated_at),
    });

    const stats = {
      total_items: assets.reduce((sum, asset) => sum + asset.quantity, 0),
      need_replacement: assets.filter(
        (asset) => asset.condition === AssetCondition.POOR,
      ).length,
    };

    return {
      stats,
      data: assets,
    };
  } catch {
    return {
      stats: { total_items: 0, need_replacement: 0 },
      data: [],
    };
  }
}

export async function insertAsset(asset: InsertAsset) {
  try {
    return await db.insert(AssetTable).values(asset);
  } catch (error) {
    throw error;
  }
}

export async function updateAsset(asset_id: string, asset: InsertAsset) {
  try {
    return await db
      .update(AssetTable)
      .set(asset)
      .where(eq(AssetTable.asset_id, asset_id));
  } catch (error) {
    throw error;
  }
}

export async function deleteAsset(asset_id: string) {
  try {
    return await db.delete(AssetTable).where(eq(AssetTable.asset_id, asset_id));
  } catch (error) {
    throw error;
  }
}
