'use client';

import { useTranslations } from 'next-intl';

import { Stat, StatGroup } from '@/components/ui/stat';

import { useTrainingFilters } from '@/lib/nuqs';
import { SessionStatus } from '@/utils/enum';

import type { TrainingSessionStats } from '@/types/training-session';

export default function SessionStats({
  stats,
}: {
  stats: TrainingSessionStats;
}) {
  const t = useTranslations('training.stats');
  const [, setSearchParams] = useTrainingFilters();

  const avgAttendance = Number(stats.avg_attendance.toFixed(1));
  const totalHours = Number(stats.total_hours.toFixed(1));

  return (
    <StatGroup>
      <Stat
        label={t('completedSessions')}
        value={stats.completed_sessions}
        unit={t('sessionUnit')}
        color={stats.completed_sessions > 0 ? 'green' : 'black'}
        onClick={() =>
          setSearchParams(
            { page: 1, status: [SessionStatus.COMPLETED] },
            { shallow: false },
          )
        }
      />
      <Stat
        label={t('averageAttendance')}
        value={avgAttendance}
        unit={t('playerUnit')}
      />
      <Stat label={t('totalHours')} value={totalHours} unit={t('hourUnit')} />
    </StatGroup>
  );
}
