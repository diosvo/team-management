'use client';

import { useMemo } from 'react';

import { ClockAlert, ClockCheck, PanelLeftClose, Percent } from 'lucide-react';

import Stats, { StatCard } from '@/components/Stats';

import { AttendanceStats as StatsType } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';
import { useAttendanceFilters } from '@/utils/filters';

export default function AttendanceStats({ stats }: { stats: StatsType }) {
  const [, setSearchParams] = useAttendanceFilters();

  const handleStatClick = (status: AttendanceStatus) => {
    setSearchParams({ status, page: 1 });
  };

  const config = useMemo<StatCard['config']>(
    () => [
      {
        key: 'on_time_count',
        label: 'On Time',
        icon: ClockCheck,
        color: 'green',
        onClick: () => handleStatClick(AttendanceStatus.ON_TIME),
      },
      {
        key: 'late_count',
        label: 'Late Entry',
        icon: ClockAlert,
        color: 'orange',
        onClick: () => handleStatClick(AttendanceStatus.LATE),
      },
      {
        key: 'absent_count',
        label: 'Absent',
        icon: PanelLeftClose,
        color: 'red',
        onClick: () => handleStatClick(AttendanceStatus.ABSENT),
      },
      {
        key: 'present_rate',
        label: 'Present Rate',
        icon: Percent,
        color: 'blue',
      },
    ],
    [],
  );

  return <Stats data={stats} config={config} />;
}
