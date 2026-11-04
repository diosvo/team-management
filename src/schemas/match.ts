import { z } from 'zod';

import { MATCH_STAT_FIELDS } from '@/utils/constants';
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
  // Mirrors DB score validation so the form shows a field error.
  .refine(
    ({ status, home_team_score, away_team_score }) =>
      status === MatchStatus.COMPLETED ||
      (home_team_score === 0 && away_team_score === 0),
    {
      message: 'scoreRequiresCompleted',
      path: ['status'],
    },
  );

export type UpsertMatchSchemaValues = z.infer<typeof UpsertMatchSchema>;

const statColumns = Object.fromEntries(
  MATCH_STAT_FIELDS.map(({ key, max }) => [
    key,
    z.coerce.number().int().min(0).max(max).default(0),
  ]),
) as Record<
  (typeof MATCH_STAT_FIELDS)[number]['key'],
  z.ZodDefault<z.ZodCoercedNumber<unknown>>
>;

export const MatchPlayerStatsRowSchema = z.object({
  player_id: z.string().min(1),
  ...statColumns,
});

/**
 * One save of the box-score grid. `removed_player_ids` are players that had a
 * row when the grid loaded and were taken off it, so their stats get deleted.
 */
export const SaveMatchPlayerStatsSchema = z.object({
  match_id: z.uuid(),
  rows: z.array(MatchPlayerStatsRowSchema),
  removed_player_ids: z.array(z.string()).default([]),
});

export type MatchPlayerStatsRow = z.infer<typeof MatchPlayerStatsRowSchema>;
export type SaveMatchPlayerStatsValues = z.infer<
  typeof SaveMatchPlayerStatsSchema
>;
