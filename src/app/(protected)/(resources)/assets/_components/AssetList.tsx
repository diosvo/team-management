'use client';

import { useMemo } from 'react';

import { Asset } from '@/drizzle/schema/asset';

import { ALL } from '@/utils/constant';
import { useAssetFilters } from '@/utils/filters';

import AssetFilters from './AssetFilters';
import AssetTable from './AssetTable';
import { UpsertAsset } from './UpsertAsset';

export default function AssetList({ data }: { data: Array<Asset> }) {
  const [{ q, category, condition }] = useAssetFilters();

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(q.toLowerCase());
        const matchesCategory =
          category === ALL.value || item.category === category;
        const matchesCondition =
          condition === ALL.value || item.condition === condition;

        return matchesSearch && matchesCategory && matchesCondition;
      }),
    [data, q, category, condition],
  );

  return (
    <>
      <AssetFilters />
      <AssetTable items={filteredData} />
      <UpsertAsset.Viewport />
    </>
  );
}
