import { z } from 'zod';

import { CURRENT_DATE } from '@/utils/constant';
import { SessionStatus } from '@/utils/enum';

export const UpsertSessionSchema = z
  .object({
    date: z.iso.date().default(CURRENT_DATE),
    start_time: z.iso.time().default('20:00'),
    end_time: z.iso.time().default('22:00'),
    location_id: z.uuid().nullable().optional(),
    coach_id: z.string().nullable().optional(),
    status: z.enum(SessionStatus).default(SessionStatus.SCHEDULED),
  })
  .refine(
    (data) => {
      // Validate that end_time is after start_time
      if (data.start_time && data.end_time) {
        return data.end_time > data.start_time;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    },
  );

export type UpsertSessionSchemaValues = z.infer<typeof UpsertSessionSchema>;
