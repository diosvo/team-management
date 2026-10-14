import { z } from 'zod';

import { SCHEDULED_INTERVALS } from '@/utils/constants';

export const EmailReportSchema = z.object({
  recipients: z.array(z.email()),
});

export type EmailReportSchemaValues = z.infer<typeof EmailReportSchema>;

export const UpsertReportScheduleSchema = z.object({
  // The cadence is implied by the window (see SCHEDULED_INTERVAL_SELECTION).
  interval: z.enum(SCHEDULED_INTERVALS),
  recipients: z
    .array(z.email())
    .min(1, { message: 'Add at least one recipient.' }),
});

export type UpsertReportScheduleValues = z.infer<
  typeof UpsertReportScheduleSchema
>;
