import { InsertMatch, Match } from '@/drizzle/schema';

import { MatchStatus } from '@/utils/enum';
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

// Match data with relationships (for db layer with 'with' queries)
const createMatchWithRelationships = (
  id: string,
  homeScore: number,
  awayScore: number,
  result: MatchStatus,
) => ({
  ...MOCK_MATCH,
  match_id: id,
  home_team_score: homeScore,
  away_team_score: awayScore,
  home_team: {
    team_id: MOCK_TEAM.team_id,
    name: MOCK_TEAM.name,
  },
  away_team: {
    team_id: MOCK_AWAY_TEAM.team_id,
    name: MOCK_AWAY_TEAM.name,
  },
  league: {
    name: MOCK_LEAGUE.name,
  },
  location: {
    name: MOCK_LOCATION.name,
  },
  result,
});

export const MOCK_MATCH_RESPONSE = {
  stats: {
    total_matches: 2,
    win_streak: 1,
    avg_win_rate: 50,
    avg_points_per_game: 84.5,
  },
  data: [
    createMatchWithRelationships('match-1', 79, 80, MatchStatus.LOSS),
    createMatchWithRelationships('match-2', 90, 85, MatchStatus.WIN),
  ],
};
