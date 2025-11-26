'use client';

import { Asset } from '@/drizzle/schema/asset';

import { ALL } from '@/utils/constant';

import AssetFilters from './AssetFilters';
import AssetTable from './AssetTable';
import { UpsertAsset } from './UpsertAsset';

import { useAssetFilters } from '../search-params';

export default function AssetList({ data }: { data: Array<Asset> }) {
  const [{ q, category, condition }] = useAssetFilters();

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(q.toLowerCase());
    const matchesCategory =
      category === ALL.value || item.category === category;
    const matchesCondition =
      condition === ALL.value || item.condition === condition;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  return (
    <>
      <AssetFilters />
      <AssetTable items={filteredData} />
      <UpsertAsset.Viewport />
    </>
  );
}
