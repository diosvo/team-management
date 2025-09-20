import { z } from 'zod';

import {
  SELECTABLE_ASSET_CATEGORIES,
  SELECTABLE_ASSET_CONDITIONS,
} from '@/utils/constant';
import { AssetCategory, AssetCondition } from '@/utils/enum';

export const UpsertAssetSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: 'Be at least 3 characters long.',
    })
    .max(64, {
      error: 'Be at most 64 characters long.',
    }),
  quantity: z.coerce
    .number()
    .min(1, 'Must be at least 1.')
    .max(100, 'Cannot exceed 100.')
    .default(1),
  condition: z.enum(SELECTABLE_ASSET_CONDITIONS).default(AssetCondition.GOOD),
  category: z
    .enum(SELECTABLE_ASSET_CATEGORIES)
    .default(AssetCategory.EQUIPMENT),
  note: z.string().max(128).optional(),
});

export type UpsertAssetSchemaValues = z.infer<typeof UpsertAssetSchema>;
