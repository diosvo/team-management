import { z } from 'zod';

export const EmailReportSchema = z.object({
  recipients: z.array(z.email()),
});

export type EmailReportSchemaValues = z.infer<typeof EmailReportSchema>;
