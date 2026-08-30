import { z } from 'zod';

import { MatchStatus } from '@/utils/enum';

export const UpsertMatchSchema = z
  .object({
    is_5x5: z.boolean().default(true),
    league_id: z.uuid().nullable().default(null),
    location_id: z.uuid().nullable(),
    date: z.iso.date(),
    time: z.iso.time(),
    away_team: z.uuid(),
    status: z.enum(MatchStatus).default(MatchStatus.SCHEDULED),
    home_team_score: z.coerce.number().min(0).max(100).default(0),
    away_team_score: z.coerce.number().min(0).max(100).default(0),
  })
  // Mirrors the `unplayed_match_has_no_score` check constraint, so the form
  // reports it as a field error instead of the database rejecting the write.
  .refine(
    ({ status, home_team_score, away_team_score }) =>
      status === MatchStatus.COMPLETED ||
      (home_team_score === 0 && away_team_score === 0),
    {
      message: 'Only a completed match can carry a score',
      path: ['status'],
    },
  );

export type UpsertMatchSchemaValues = z.infer<typeof UpsertMatchSchema>;
