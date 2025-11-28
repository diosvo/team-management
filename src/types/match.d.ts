import { Match, Team } from '@/drizzle/schema';
import { MatchStatus } from '@/utils/enum';

export interface MatchWithTeams extends Match {
  home_team: Pick<Team, 'name' | 'team_id'>;
  away_team: Pick<Team, 'name' | 'team_id'>;
  league: Nullable<{
    name: string;
  }>;
  result: `${MatchStatus}`;
  location: Nullable<{
    name: string;
  }>;
}

export interface MatchStats {
  total_matches: number;
  win_streak: number;
  avg_win_rate: number;
  avg_points_per_game: number;
}
