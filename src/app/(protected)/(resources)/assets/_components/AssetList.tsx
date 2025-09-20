'use client';

import { useState } from 'react';

import { Asset } from '@/drizzle/schema/asset';
import { ALL } from '@/utils/constant';
import AssetFilters from './AssetFilters';

import AssetTable from './AssetTable';
import { UpsertAsset } from './UpsertAsset';

export default function AssetList({ data }: { data: Array<Asset> }) {
  const [filters, setFilters] = useState({
    query: '',
    category: ALL.value,
    condition: ALL.value,
  });

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(filters.query.toLowerCase());
    const matchesCategory =
      filters.category === ALL.value || item.category === filters.category;
    const matchesCondition =
      filters.condition === ALL.value || item.condition === filters.condition;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  return (
    <>
      <AssetFilters search={filters} setSearch={setFilters} />
      <AssetTable items={filteredData} />
      <UpsertAsset.Viewport />
    </>
  );
}
