'use client';

import { useMemo } from 'react';

import { differenceInDays, parse } from 'date-fns';
import { Hourglass, Target, UsersRound } from 'lucide-react';

import Stats, { StatCard } from '@/components/Stats';

import { AnalyticsStats, AttendanceHistoryRecord } from '@/types/analytics';
import { LOCALE_DATE_FORMAT } from '@/utils/constant';

export default function SummaryStats({
  records,
}: {
  records: Array<AttendanceHistoryRecord>;
}) {
  const stats: AnalyticsStats = useMemo(() => {
    const total_sessions = records.length;

    if (total_sessions === 0) {
      return { total_sessions: 0, avg_attendance: 0, avg_recovery_days: 0 };
    }

    const avg_attendance =
      records.reduce((sum, { attended }) => sum + attended, 0) / total_sessions;

    const gaps = records
      .slice(0, -1)
      .map((_, i) =>
        differenceInDays(
          parse(records[i].date, LOCALE_DATE_FORMAT, new Date()),
          parse(records[i + 1].date, LOCALE_DATE_FORMAT, new Date()),
        ),
      );

    const avg_recovery_days =
      gaps.length > 0
        ? gaps.reduce((sum, day) => sum + day, 0) / gaps.length
        : 0;

    return {
      total_sessions,
      avg_attendance: Math.round(avg_attendance),
      avg_recovery_days: Math.round(avg_recovery_days),
    };
  }, [records]);

  const config: StatCard['config'] = [
    {
      key: 'total_sessions',
      label: 'Sessions',
      icon: Target,
      color: 'green',
    },
    {
      key: 'avg_attendance',
      label: 'Players per session',
      icon: UsersRound,
      color: 'purple',
    },
    {
      key: 'avg_recovery_days',
      label: 'Avg Recovery Days',
      icon: Hourglass,
      color: 'orange',
    },
  ];

  return <Stats data={stats} config={config} />;
}
