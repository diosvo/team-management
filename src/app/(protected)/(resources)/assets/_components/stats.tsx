import { useMemo } from 'react';

import { AlertTriangle, Package } from 'lucide-react';

import Stats from '@/components/stats';

export default function AssetStats({
  stats,
}: {
  stats: {
    total_items: number;
    need_replacement: number;
  };
}) {
  const statCards = useMemo(() => {
    return [
      {
        label: 'Total Items',
        icon: Package,
        colorScheme: 'gray',
        value: stats.total_items,
      },
      {
        label: 'Need Replacement',
        icon: AlertTriangle,
        colorScheme: 'red',
        value: stats.need_replacement,
      },
    ];
  }, [stats]);

  return <Stats stats={statCards} />;
}
