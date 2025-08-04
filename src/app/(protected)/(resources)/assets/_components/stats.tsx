'use client';

import { AlertTriangle, Package } from 'lucide-react';

import Stats from '@/components/stats';

const ASSET_STATS = [
  {
    key: 'total_items',
    label: 'Total Items',
    icon: Package,
    color: 'gray' as const,
  },
  {
    key: 'need_replacement',
    label: 'Need Replacement',
    icon: AlertTriangle,
    color: 'red' as const,
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
