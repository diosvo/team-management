import { z } from 'zod';

import {
  ESTABLISHED_DATE,
  INDIVIDUAL_ACHIEVEMENT_TYPES,
  SELECTABLE_ACHIEVEMENT_TYPES,
} from '@/utils/constants';
import { AchievementType } from '@/utils/enum';

// A blank title is stored as null so the type's translated label shows instead.
const blankToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export const UpsertAchievementSchema = z
  .object({
    type: z
      .enum(SELECTABLE_ACHIEVEMENT_TYPES)
      .default(AchievementType.CHAMPION),
    title: z
      .preprocess(blankToNull, z.string().trim().min(3).max(128).nullish())
      .transform((title) => title ?? null),
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
  .refine((data) => data.type !== AchievementType.CUSTOM || !!data.title, {
    message: 'customTitleRequired',
    path: ['title'],
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
