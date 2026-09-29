'use client';

import { Stat, StatGroup } from '@/components/ui/stat';

import { useAssetFilters } from '@/lib/nuqs';
import { AssetCondition } from '@/utils/enum';

type AssetStatsProps = {
  stats: {
    total_items: number;
    need_replacement: number;
    obsolete_count: number;
  };
};

export default function AssetStats({ stats }: AssetStatsProps) {
  const [params, setSearchParams] = useAssetFilters();

  const handleClick = (condition: AssetCondition) => {
    setSearchParams({
      ...params,
      condition: [condition],
      page: 1,
    });
  };

  return (
    <StatGroup>
      <Stat
        label="Total Quantity"
        value={stats.total_items}
        unit="item"
        onClick={() => setSearchParams(null)}
      />
      <Stat
        label="Need Replacement"
        value={stats.need_replacement}
        unit="item"
        color={stats.need_replacement > 0 ? 'red' : 'black'}
        onClick={() => handleClick(AssetCondition.POOR)}
      />
      <Stat
        label="Outdated"
        value={stats.obsolete_count}
        unit="item"
        color="gray"
        onClick={() => handleClick(AssetCondition.OBSOLETE)}
      />
    </StatGroup>
  );
}
