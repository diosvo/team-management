'use client';

import { useMemo } from 'react';

import { Activity, Check, Users } from 'lucide-react';

import Stats from '@/components/stats';

interface TestingStatsProps {
  stats: {
    total_players: number;
    completed_tests: number;
    next_test_in_days: number;
  };
}

export default function TestingStats({ stats }: TestingStatsProps) {
  const statCards = useMemo(() => {
    return [
      {
        label: 'Players Joined',
        icon: Users,
        colorScheme: 'gray',
        value: stats.total_players,
        suffix: '',
      },
      {
        label: 'Completed Tests',
        icon: Check,
        colorScheme: 'green',
        value: stats.completed_tests,
        suffix: '',
      },
      {
        label: 'Next Test In',
        icon: Activity,
        colorScheme: 'blue',
        value: stats.next_test_in_days,
        suffix: stats.next_test_in_days === 1 ? ' day' : ' days',
      },
    ];
  }, [stats]);

  return <Stats stats={statCards} />;
}
