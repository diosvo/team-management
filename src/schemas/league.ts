import { z } from 'zod';

import { CURRENT_DATE, SELECTABLE_LEAGUE_STATUS } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';

export const UpsertLeagueSchema = z
  .object({
    name: z
      .string()
      .min(3, {
        message: 'Be at least 3 characters long.',
      })
      .max(64, {
        error: 'Be at most 64 characters long.',
      }),
    start_date: z.iso.date().default(CURRENT_DATE),
    end_date: z.iso.date().default(CURRENT_DATE),
    status: z
      .enum(SELECTABLE_LEAGUE_STATUS)
      .optional()
      .default(LeagueStatus.UPCOMING),
    location_id: z.uuid().optional(),
    description: z
      .string()
      .max(128, {
        error: 'Be at most 128 characters long.',
      })
      .nullable(),
  })
  .refine(
    (data) => {
      // Validate that end_date is after start_date
      if (data.start_date && data.end_date) {
        return data.end_date > data.start_date;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    },
  );

export type UpsertLeagueSchemaValues = z.infer<typeof UpsertLeagueSchema>;
