import { z } from 'zod';

export const ruleSchema = z.object({
  rule_id: z.string().uuid(),
  team_id: z.string().uuid(),
  content: z.string(),
});
