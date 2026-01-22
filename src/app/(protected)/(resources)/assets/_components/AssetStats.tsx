'use client';

import { useMemo } from 'react';

import { AlertTriangle, Package } from 'lucide-react';

import Stats, { type StatCard } from '@/components/Stats';

import { AssetCondition } from '@/utils/enum';
import { useAssetFilters } from '@/utils/filters';

type AssetStatsProps = {
  stats: {
    total_items: number;
    need_replacement: number;
  };
};

export default function AssetStats({ stats }: AssetStatsProps) {
  const [, setSearchParams] = useAssetFilters();

  const config = useMemo<StatCard['config']>(
    () => [
      {
        key: 'total_items',
        label: 'Total Items',
        icon: Package,
        color: 'green',
        onClick: () => setSearchParams(null),
      },
      {
        key: 'need_replacement',
        label: 'Need Replacement',
        icon: AlertTriangle,
        color: 'red',
        onClick: () => {
          setSearchParams(null);
          setSearchParams({ condition: AssetCondition.POOR });
        },
      },
    ],
    [setSearchParams],
  );

  return <Stats data={stats} config={config} />;
}
