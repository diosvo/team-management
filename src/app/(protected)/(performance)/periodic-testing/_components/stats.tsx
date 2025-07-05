'use client';

import { useMemo } from 'react';

import { Activity, Check, Users } from 'lucide-react';

import Stats, { StatCard } from '@/components/stats';

interface TestingStatsProps {
  stats: {
    total_players: number;
    completed_tests: number;
    next_test_in_days: number;
  };
}

export default function TestingStats({ stats }: TestingStatsProps) {
  const statCards: Array<StatCard> = useMemo(() => {
    return [
      {
        label: 'Players Joined',
        icon: Users,
        color: 'gray',
        value: stats.total_players,
      },
      {
        label: 'Completed Tests',
        icon: Check,
        color: 'green',
        value: stats.completed_tests,
      },
      {
        label: 'Next Test In',
        icon: Activity,
        color: 'blue',
        value: stats.next_test_in_days,
        suffix: 'day',
      },
    ];
  }, [stats]);

  return <Stats stats={statCards} />;
}
