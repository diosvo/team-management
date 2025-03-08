import { z } from 'zod';

export const RuleSchema = z.object({
  team_id: z.string().uuid(),
  content: z.string().min(1, 'Required'),
});

export type RuleValues = z.infer<typeof RuleSchema>;
