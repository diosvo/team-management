import { getTranslations } from 'next-intl/server';

import { Stat, StatGroup } from '@/components/ui/stat';

import { getPerformanceSummary } from '@/actions/player-performance';
import { enumLabel } from '@/i18n/enums';
import type { DateRange } from '@/types/common';
import { formatDate } from '@/utils/datetime';
import { colorRank } from '@/utils/helper';

import { PERFORMANCE_STAT_COLUMNS } from './PerformanceSkeleton';

export default async function PerformanceStats({
  target_id,
  range,
}: {
  target_id: string;
  range: DateRange;
}) {
  const [{ attendance, tests_taken, last_tested, honors }, t, te] =
    await Promise.all([
      getPerformanceSummary(target_id, range),
      getTranslations('performance.stats'),
      getTranslations('enums'),
    ]);
  const attended = attendance.on_time + attendance.late;

  return (
    <StatGroup columns={PERFORMANCE_STAT_COLUMNS}>
      <Stat
        label={t('attendanceRate')}
        value={attendance.rate}
        unit="%"
        color={attendance.total > 0 ? colorRank(attendance.rate) : 'black'}
        helpText={
          attendance.total > 0
            ? t('attended', { attended, total: attendance.total })
            : t('noSessions')
        }
      />
      <Stat
        label={t('currentStreak')}
        value={attendance.current_streak}
        unit={t('sessionUnit')}
        color={attendance.current_streak > 0 ? 'green' : 'black'}
        helpText={t('bestRun', { count: attendance.best_streak })}
      />
      <Stat
        label={t('testsTaken')}
        value={tests_taken}
        unit={t('testUnit')}
        helpText={
          last_tested
            ? t('lastTested', { date: formatDate(last_tested) })
            : t('allTime')
        }
      />
      <Stat
        label={t('honors')}
        value={honors.count}
        unit={t('honorUnit')}
        color={honors.count > 0 ? 'purple' : 'black'}
        helpText={
          honors.latest
            ? `${enumLabel(te, 'achievementType', honors.latest.type)} · ${honors.latest.year}`
            : t('honorsHint')
        }
      />
    </StatGroup>
  );
}
