import { z } from 'zod';

import { MAX_DAY_OF_MONTH } from '@/utils/constants';
import { Interval, ReportFrequency } from '@/utils/enum';

export const EmailReportSchema = z.object({
  recipients: z.array(z.email()),
});

export type EmailReportSchemaValues = z.infer<typeof EmailReportSchema>;

export const UpsertReportScheduleSchema = z
  .object({
    interval: z.enum(Interval),
    frequency: z.enum(ReportFrequency),
    day_of_week: z.number().int().min(0).max(6).nullish(),
    // Capped at 28 so the chosen day exists in every month.
    day_of_month: z.number().int().min(1).max(MAX_DAY_OF_MONTH).nullish(),
    recipients: z
      .array(z.email())
      .min(1, { message: 'Add at least one recipient.' }),
  })
  .superRefine((values, ctx) => {
    if (
      values.frequency === ReportFrequency.WEEKLY &&
      values.day_of_week == null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['day_of_week'],
        message: 'Pick a weekday.',
      });
    }
    // Quarterly picks a day of the month too; only the month spacing differs.
    if (
      values.frequency !== ReportFrequency.WEEKLY &&
      values.day_of_month == null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['day_of_month'],
        message: 'Pick a day of the month.',
      });
    }
  })
  // Canonical cadence: only the day matching the frequency survives, so
  // consumers never re-derive the "weekly ⇒ weekday, otherwise ⇒ day" rule.
  .transform((values) => {
    const weekly = values.frequency === ReportFrequency.WEEKLY;
    return {
      ...values,
      day_of_week: weekly ? (values.day_of_week ?? null) : null,
      day_of_month: weekly ? null : (values.day_of_month ?? null),
    };
  });

export type UpsertReportScheduleValues = z.infer<
  typeof UpsertReportScheduleSchema
>;
