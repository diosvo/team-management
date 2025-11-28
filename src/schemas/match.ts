import { z } from 'zod';

export const UpsertMatchSchema = z.object({
  is_5x5: z.boolean().default(true),
  league_id: z.uuid().nullable(),
  location_id: z.uuid().nullable(),
  date: z.iso.date(),
  time: z.iso.time(),
  away_team: z.uuid(),
  home_team_score: z.coerce.number().min(0).max(100).default(0),
  away_team_score: z.coerce.number().min(0).max(100).default(0),
});

export type UpsertMatchSchemaValues = z.infer<typeof UpsertMatchSchema>;
