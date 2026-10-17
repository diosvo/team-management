import { SimpleGrid } from '@chakra-ui/react';
import { getLocale, getTranslations } from 'next-intl/server';

import { Card } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';

import { getOverviewStats } from '@/actions/analytics';
import { getYearsActive } from '@/app/(protected)/_helpers/utils';

export default async function OverviewStats() {
  const [stats, t, locale] = await Promise.all([
    getOverviewStats(),
    getTranslations('dashboard.overview'),
    getLocale(),
  ]);

  return (
    <Card
      title={t('title')}
      description={t('description', { duration: getYearsActive(locale) })}
    >
      <SimpleGrid minChildWidth="9rem" gap={4}>
        <Stat
          label={t('nextGame')}
          value={stats.next_game}
          unit={t('daysRemaining')}
          hidden={stats.next_game == null}
        />
        <Stat
          label={t('activePlayers')}
          value={stats.active_players}
          color="red"
        />
        <Stat
          label={t('winRate')}
          value={stats.win_rate}
          unit="%"
          color={stats.win_rate > 50 ? 'green' : 'red'}
        />
        <Stat
          label={t('achievements')}
          value={stats.achievements}
          unit={t('achievementsUnit')}
          color={stats.achievements > 0 ? 'green' : 'red'}
        />
      </SimpleGrid>
    </Card>
  );
}
