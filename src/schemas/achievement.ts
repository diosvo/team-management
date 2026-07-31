import { z } from 'zod';

import {
  ESTABLISHED_DATE,
  INDIVIDUAL_ACHIEVEMENT_TYPES,
  SELECTABLE_ACHIEVEMENT_TYPES,
} from '@/utils/constant';
import { AchievementType } from '@/utils/enum';

export const UpsertAchievementSchema = z
  .object({
    type: z
      .enum(SELECTABLE_ACHIEVEMENT_TYPES)
      .default(AchievementType.CHAMPION),
    title: z
      .string()
      .min(3, {
        message: 'Be at least 3 characters long.',
      })
      .max(128, {
        error: 'Be at most 128 characters long.',
      }),
    year: z
      .int()
      .min(new Date(ESTABLISHED_DATE).getFullYear(), {
        message: 'Be after the club was founded.',
      })
      .max(new Date().getFullYear(), {
        message: 'Not be in the future.',
      })
      .default(new Date().getFullYear()),
    league_id: z.uuid().nullish(),
    player_id: z.string().nullish(),
    description: z
      .string()
      .max(256, {
        error: 'Be at most 256 characters long.',
      })
      .nullish(),
  })
  .refine(
    (data) =>
      !INDIVIDUAL_ACHIEVEMENT_TYPES.includes(
        data.type as (typeof INDIVIDUAL_ACHIEVEMENT_TYPES)[number],
      ) || !!data.player_id,
    {
      message: 'Select the awarded player for an individual honor.',
      path: ['player_id'],
    },
  );

export type UpsertAchievementSchemaValues = z.infer<
  typeof UpsertAchievementSchema
>;
