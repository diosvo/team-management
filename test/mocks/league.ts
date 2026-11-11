import { LeagueStatus } from '@/utils/enum';

import type { InsertLeague, League } from '@/drizzle/schema';

export const MOCK_LEAGUE_INPUT: InsertLeague = {
  name: 'Summer League',
  description: 'Test league',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
};

export const MOCK_LEAGUE: League = {
  league_id: 'league-123',
  name: MOCK_LEAGUE_INPUT.name,
  description: MOCK_LEAGUE_INPUT.description as string,
  start_date: MOCK_LEAGUE_INPUT.start_date,
  end_date: MOCK_LEAGUE_INPUT.end_date,
  // Derived from the dates above, not stored.
  status: LeagueStatus.ENDED,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

/** A league as the achievement dialog lists it; the form validates `league_id` as a uuid. */
export const MOCK_LEAGUE_OPTION = {
  ...MOCK_LEAGUE,
  league_id: '11111111-1111-1111-1111-111111111111',
  player_count: 0,
  achievement_type: [],
};
