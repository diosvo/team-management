import { z } from 'zod';

export const RuleSchema = z.object({
  content: z.string().default(''),
});

export type RuleValues = z.infer<typeof RuleSchema>;
