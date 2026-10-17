import { z } from 'zod';

import {
  ESTABLISHED_DATE,
  INDIVIDUAL_ACHIEVEMENT_TYPES,
  SELECTABLE_ACHIEVEMENT_TYPES,
} from '@/utils/constants';
import { AchievementType } from '@/utils/enum';

export const UpsertAchievementSchema = z
  .object({
    type: z
      .enum(SELECTABLE_ACHIEVEMENT_TYPES)
      .default(AchievementType.CHAMPION),
    title: z.string().min(3).max(128),
    year: z
      .int()
      .min(new Date(ESTABLISHED_DATE).getFullYear(), {
        error: 'afterClubFounded',
      })
      .max(new Date().getFullYear(), {
        error: 'notInFuture',
      })
      .default(new Date().getFullYear()),
    league_id: z.uuid().nullish(),
    player_id: z.string().nullish(),
    description: z.string().max(256).nullish(),
  })
  .refine(
    (data) =>
      !INDIVIDUAL_ACHIEVEMENT_TYPES.includes(
        data.type as (typeof INDIVIDUAL_ACHIEVEMENT_TYPES)[number],
      ) || !!data.player_id,
    {
      message: 'awardedPlayerRequired',
      path: ['player_id'],
    },
  );

export type UpsertAchievementSchemaValues = z.infer<
  typeof UpsertAchievementSchema
>;
