import { z } from 'zod';

import {
  CURRENT_DATE,
  SELECTABLE_ASSET_CATEGORIES,
  SELECTABLE_ASSET_CONDITIONS,
} from '@/utils/constants';
import { AssetCategory, AssetCondition } from '@/utils/enum';
import { plainTextLength } from '@/utils/helper';

/** Note length is counted in visible characters, not HTML. */
export const NOTE_LIMIT = 128;

export const UpsertAssetSchema = z.object({
  name: z.string().min(3).max(64),
  quantity: z.coerce.number().min(1).max(100).default(1),
  condition: z.enum(SELECTABLE_ASSET_CONDITIONS).default(AssetCondition.GOOD),
  category: z
    .enum(SELECTABLE_ASSET_CATEGORIES)
    .default(AssetCategory.EQUIPMENT),
  assigned_to: z.string().max(64).nullish(),
  acquired_date: z.iso.date().nullish().default(CURRENT_DATE),
  note: z
    .string()
    .max(NOTE_LIMIT * 32, { error: 'noteTooLarge' })
    // Reported as a regular length issue so the error map localizes it
    .superRefine((html, ctx) => {
      if (plainTextLength(html) > NOTE_LIMIT) {
        ctx.addIssue({
          code: 'too_big',
          origin: 'string',
          maximum: NOTE_LIMIT,
          inclusive: true,
          input: html,
        });
      }
    })
    .nullable(),
});

export type UpsertAssetSchemaValues = z.infer<typeof UpsertAssetSchema>;
