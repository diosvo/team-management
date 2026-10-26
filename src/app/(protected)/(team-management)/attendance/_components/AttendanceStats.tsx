'use client';

import { useTranslations } from 'next-intl';

import { Stat, StatGroup } from '@/components/ui/stat';

import { useAttendanceFilters } from '@/lib/nuqs';
import type { AttendanceStats as StatsType } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';
import { colorRank } from '@/utils/helper';

export default function AttendanceStats({ stats }: { stats: StatsType }) {
  const t = useTranslations('attendance.stats');
  const [, setSearchParams] = useAttendanceFilters();

  const handleClick = (status: AttendanceStatus) =>
    setSearchParams({ page: 1, q: '', status: [status] });

  return (
    <StatGroup>
      <Stat
        label={t('onTime')}
        value={stats.on_time_count}
        color="green"
        onClick={() => handleClick(AttendanceStatus.ON_TIME)}
      />
      <Stat
        label={t('late')}
        value={stats.late_count}
        color="orange"
        onClick={() => handleClick(AttendanceStatus.LATE)}
      />
      <Stat
        label={t('absent')}
        value={stats.absent_count}
        color="red"
        onClick={() => handleClick(AttendanceStatus.ABSENT)}
      />
      <Stat
        label={t('presentRate')}
        value={stats.present_rate}
        unit="%"
        color={colorRank(stats.present_rate)}
      />
    </StatGroup>
  );
}
