'use client';

import { useMemo } from 'react';

import { Activity, Users } from 'lucide-react';

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
        label: 'Total Players Joined',
        icon: Users,
        colorScheme: 'blue',
        value: stats.total_players,
        suffix: '',
      },
      {
        label: 'Next Test In',
        icon: Activity,
        colorScheme: 'cyan',
        value: stats.next_test_in_days,
        suffix: stats.next_test_in_days === 1 ? ' day' : ' days',
      },
    ];
  }, [stats]);

  return <Stats stats={statCards} />;
}
