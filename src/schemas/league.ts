import { z } from 'zod';

import { CURRENT_DATE } from '@/utils/constants';

export const UpsertLeagueSchema = z
  .object({
    name: z.string().min(3).max(64),
    start_date: z.iso.date().default(CURRENT_DATE),
    end_date: z.iso.date().default(CURRENT_DATE),
    description: z.string().max(128).nullable(),
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
      message: 'endDateAfterStartDate',
      path: ['end_date'],
    },
  );

export type UpsertLeagueSchemaValues = z.infer<typeof UpsertLeagueSchema>;
