'use client';

import { useMemo } from 'react';

import { AlertTriangle, Package } from 'lucide-react';

import Stats, { StatCard } from '@/components/stats';

export default function AssetStats({
  stats,
}: {
  stats: {
    total_items: number;
    need_replacement: number;
  };
}) {
  const statCards: Array<StatCard> = useMemo(() => {
    return [
      {
        label: 'Total Items',
        icon: Package,
        color: 'gray',
        value: stats.total_items,
      },
      {
        label: 'Need Replacement',
        icon: AlertTriangle,
        color: 'red',
        value: stats.need_replacement,
      },
    ];
  }, [stats]);

  return <Stats stats={statCards} />;
}
