import { InsertLeague, League } from '@/drizzle/schema';
import { LeagueStatus } from '@/utils/enum';

export const MOCK_LEAGUE_INPUT: InsertLeague = {
  name: 'Summer League',
  description: 'Test league',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  status: LeagueStatus.ONGOING,
};

export const MOCK_LEAGUE: League = {
  league_id: 'league-123',
  name: MOCK_LEAGUE_INPUT.name,
  description: MOCK_LEAGUE_INPUT.description as string,
  start_date: MOCK_LEAGUE_INPUT.start_date,
  end_date: MOCK_LEAGUE_INPUT.end_date,
  status: LeagueStatus.ONGOING,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};
