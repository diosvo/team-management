import { z } from 'zod';

export const ruleSchema = z.object({
  team_id: z.string().uuid(),
  content: z.string().min(1, 'Required'),
});
