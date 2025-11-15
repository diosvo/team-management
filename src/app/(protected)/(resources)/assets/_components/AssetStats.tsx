'use client';

import { AlertTriangle, Package } from 'lucide-react';

import Stats, { type StatCard } from '@/components/stats';

const ASSET_STATS: StatCard['config'] = [
  {
    key: 'total_items',
    label: 'Total Items',
    icon: Package,
    color: 'green',
  },
  {
    key: 'need_replacement',
    label: 'Need Replacement',
    icon: AlertTriangle,
    color: 'red',
  },
];

export default function AssetStats({
  stats,
}: {
  stats: {
    total_items: number;
    need_replacement: number;
  };
}) {
  return <Stats data={stats} config={ASSET_STATS} />;
}
