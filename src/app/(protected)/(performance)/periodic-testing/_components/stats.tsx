'use client';

import { Calendar, Check, Users } from 'lucide-react';

import Stats from '@/components/stats';

const TESTING_STATS = [
  {
    key: 'test_date',
    label: 'Test Date',
    icon: Calendar,
    color: 'gray' as const,
  },
  {
    key: 'total_players',
    label: 'Players Joined',
    icon: Users,
    color: 'blue' as const,
  },
  {
    key: 'completed_tests',
    label: 'Completed Tests',
    icon: Check,
    color: 'green' as const,
  },
];

export default function TestingStats({
  stats,
}: {
  stats: {
    test_date: string;
    total_players: number;
    completed_tests: number;
  };
}) {
  return <Stats data={stats} config={TESTING_STATS} />;
}
