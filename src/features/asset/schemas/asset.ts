import { z } from 'zod';

import {
  SELECTABLE_ASSET_CATEGORIES,
  SELECTABLE_ASSET_CONDITIONS,
} from '@/utils/constant';
import { AssetCategory, AssetCondition } from '@/utils/enum';

export const UpsertAssetSchema = z.object({
  name: z.string().min(0).max(128),
  quantity: z.number().int().min(1).max(100).default(1),
  condition: z.enum(SELECTABLE_ASSET_CONDITIONS).default(AssetCondition.GOOD),
  category: z
    .enum(SELECTABLE_ASSET_CATEGORIES)
    .default(AssetCategory.EQUIPMENT),
  note: z.string().max(128).optional(),
});

export type UpsertAssetSchemaValues = z.infer<typeof UpsertAssetSchema>;
