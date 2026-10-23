import { Stat, StatGroup } from '@/components/ui/stat';

import type { MatchStats } from '@/types/match';

export default function MatchesStats({ stats }: { stats: MatchStats }) {
  return (
    <StatGroup>
      <Stat label="Total Matches" value={stats.total_matches} unit="game" />
      <Stat label="Played" value={stats.played_matches} unit="game" />
      <Stat
        label="Win Streak"
        value={stats.win_streak}
        unit="game"
        color={stats.win_streak > 0 ? 'green' : 'red'}
      />
      <Stat
        label="Avg Win Rate"
        value={stats.avg_win_rate}
        unit="%"
        color={stats.avg_win_rate > 50 ? 'green' : 'red'}
      />
      <Stat
        label="Avg Points/Game"
        value={stats.avg_points_per_game}
        unit="pts"
      />
    </StatGroup>
  );
}
