import { InsertMatch, Match } from '@/drizzle/schema';

import { MOCK_LEAGUE } from './league';
import { MOCK_LOCATION } from './location';
import { MOCK_AWAY_TEAM, MOCK_TEAM } from './team';

export const MOCK_MATCH_INPUT: InsertMatch = {
  home_team: MOCK_TEAM.team_id,
  away_team: MOCK_AWAY_TEAM.team_id,
  league_id: MOCK_LEAGUE.league_id,
  location_id: MOCK_LOCATION.location_id,
  date: '2024-01-15',
  time: '19:00',
  home_team_score: 40,
  away_team_score: 35,
  is_5x5: true,
};

export const MOCK_MATCH: Match = {
  ...(MOCK_MATCH_INPUT as Match),
  match_id: 'match-123',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};
