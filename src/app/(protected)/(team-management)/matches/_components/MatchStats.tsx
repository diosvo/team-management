import { useTranslations } from 'next-intl';

import { Stat, StatGroup } from '@/components/ui/stat';

import type { MatchStats } from '@/types/match';

export default function MatchesStats({ stats }: { stats: MatchStats }) {
  const t = useTranslations('matches.stats');

  return (
    <StatGroup>
      <Stat
        label={t('totalMatches')}
        value={stats.total_matches}
        unit={t('gameUnit')}
      />
      <Stat
        label={t('played')}
        value={stats.played_matches}
        unit={t('gameUnit')}
      />
      <Stat
        label={t('winStreak')}
        value={stats.win_streak}
        unit={t('gameUnit')}
        color={stats.win_streak > 0 ? 'green' : 'red'}
      />
      <Stat
        label={t('avgWinRate')}
        value={stats.avg_win_rate}
        unit="%"
        color={stats.avg_win_rate > 50 ? 'green' : 'red'}
      />
      <Stat
        label={t('avgPointsPerGame')}
        value={stats.avg_points_per_game}
        unit={t('pointsUnit')}
      />
    </StatGroup>
  );
}
