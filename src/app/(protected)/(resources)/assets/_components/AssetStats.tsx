'use client';

import { useTranslations } from 'next-intl';

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
  const t = useTranslations('assets.stats');
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
        label={t('totalQuantity')}
        value={stats.total_items}
        unit={t('unit')}
        onClick={() => setSearchParams(null)}
      />
      <Stat
        label={t('needReplacement')}
        value={stats.need_replacement}
        unit={t('unit')}
        color={stats.need_replacement > 0 ? 'red' : 'black'}
        onClick={() => handleClick(AssetCondition.POOR)}
      />
      <Stat
        label={t('outdated')}
        value={stats.obsolete_count}
        unit={t('unit')}
        color="gray"
        onClick={() => handleClick(AssetCondition.OBSOLETE)}
      />
    </StatGroup>
  );
}
