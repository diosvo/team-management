import { useTranslations } from 'next-intl';

import { Stat, StatGroup } from '@/components/ui/stat';

export default function TestingStats({
  stats,
}: {
  stats: {
    total_players: number;
    completed_tests: number;
  };
}) {
  const t = useTranslations('periodicTesting.stats');

  return (
    <StatGroup>
      <Stat
        label={t('playersJoined')}
        value={stats.total_players}
        unit={t('playerUnit')}
      />
      <Stat
        label={t('completedTests')}
        value={stats.completed_tests}
        unit={t('testUnit')}
        color={stats.completed_tests > 0 ? 'green' : 'black'}
      />
    </StatGroup>
  );
}
