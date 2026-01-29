import { Asset } from '@/drizzle/schema';

import { UpsertAssetSchemaValues } from '@/schemas/asset';
import { AssetCategory, AssetCondition } from '@/utils/enum';

import { MOCK_TEAM } from './team';

export const MOCK_ASSET_INPUT: UpsertAssetSchemaValues = {
  name: 'Test Asset',
  category: AssetCategory.EQUIPMENT,
  quantity: 10,
  condition: AssetCondition.GOOD,
  note: undefined,
};

export const MOCK_ASSET: Asset = {
  asset_id: 'asset-123',
  team_id: MOCK_TEAM.team_id,
  name: MOCK_ASSET_INPUT.name,
  category: MOCK_ASSET_INPUT.category,
  quantity: MOCK_ASSET_INPUT.quantity,
  condition: MOCK_ASSET_INPUT.condition,
  note: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_ASSET_STATS = {
  total_items: MOCK_ASSET.quantity,
  need_replacement: 0,
};
