'use client';

import { CalendarCheck, Timer, UsersRound } from 'lucide-react';

import Stats, { StatCard } from '@/components/Stats';

import { TrainingSessionStats } from '@/types/training-session';

export default function SessionStats({
  stats,
}: {
  stats: TrainingSessionStats;
}) {
  const config: StatCard['config'] = [
    {
      key: 'completed_sessions',
      label: 'Completed Sessions',
      icon: CalendarCheck,
      color: 'green',
    },
    {
      key: 'avg_attendance',
      label: 'Average Attendance',
      icon: UsersRound,
      color: 'orange',
    },
    {
      key: 'total_hours',
      label: 'Total Hours',
      icon: Timer,
      color: 'blue',
    },
  ];

  return <Stats data={stats} config={config} />;
}
