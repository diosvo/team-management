import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { Asset, AssetTable, InsertAsset } from '@/drizzle/schema/asset';

export async function getAssets(team_id: string) {
  try {
    return await db.query.AssetTable.findFirst({
      where: eq(AssetTable.team_id, team_id),
    });
  } catch {
    return null;
  }
}

export async function getAsset(asset_id: string) {
  try {
    return await db.query.AssetTable.findFirst({
      where: eq(AssetTable.asset_id, asset_id),
    });
  } catch {
    return null;
  }
}

export async function insertAsset(asset: InsertAsset) {
  try {
    return await db.insert(AssetTable).values(asset).returning({
      asset_id: AssetTable.asset_id,
    });
  } catch (error) {
    throw error;
  }
}

export async function updateAsset(asset: Asset) {
  try {
    return await db
      .update(AssetTable)
      .set(asset)
      .where(eq(AssetTable.asset_id, asset.asset_id));
  } catch (error) {
    throw error;
  }
}
