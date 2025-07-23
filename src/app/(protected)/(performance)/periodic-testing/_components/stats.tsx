'use client';

import { Check, Users } from 'lucide-react';

import Stats from '@/components/stats';

const TESTING_STATS = [
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
    total_players: number;
    completed_tests: number;
  };
}) {
  return <Stats data={stats} config={TESTING_STATS} />;
}
