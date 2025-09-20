'use client';

import { Check, Users } from 'lucide-react';

import Stats, { type StatCard } from '@/components/stats';

const TESTING_STATS: StatCard['config'] = [
  {
    key: 'total_players',
    label: 'Players Joined',
    icon: Users,
    color: 'blue',
  },
  {
    key: 'completed_tests',
    label: 'Completed Tests',
    icon: Check,
    color: 'green',
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
