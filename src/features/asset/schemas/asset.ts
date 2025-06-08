import { z } from 'zod';

import {
  SELECTABLE_ASSET_CATEGORIES,
  SELECTABLE_ASSET_CONDITIONS,
} from '@/utils/constant';
import { AssetCategory, AssetCondition } from '@/utils/enum';

export const AddItemSchema = z.object({
  name: z.string().min(0).max(128),
  quantity: z.number().int().min(1).max(100),
  condition: z.enum(SELECTABLE_ASSET_CONDITIONS).default(AssetCondition.GOOD),
  category: z
    .enum(SELECTABLE_ASSET_CATEGORIES)
    .default(AssetCategory.EQUIPMENT),
});

export type AddItemSchemaValues = z.infer<typeof AddItemSchema>;
