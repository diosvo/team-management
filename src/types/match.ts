import type { MatchResult } from '@/utils/enum';

import type { Match, Team } from '@/drizzle/schema';

// The `home_team` / `away_team` columns hold team ids; the query layer
// replaces them with the joined team rows.
export interface MatchWithTeams extends Omit<Match, 'home_team' | 'away_team'> {
  home_team: Pick<Team, 'name' | 'team_id'>;
  away_team: Pick<Team, 'name' | 'team_id'>;
  league: Nullable<{
    name: string;
  }>;
  /** `null` until the match is played — see `MatchStatus`. */
  result: Nullable<`${MatchResult}`>;
  location: Nullable<{
    name: string;
  }>;
}

export interface MatchStats {
  total_matches: number;
  played_matches: number;
  win_streak: number;
  avg_win_rate: number;
  avg_points_per_game: number;
}
