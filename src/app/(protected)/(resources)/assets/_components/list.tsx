'use client';

import { useState } from 'react';

import { Asset } from '@/drizzle/schema/asset';
import { ALL } from '@/utils/constant';

import Fitlers from './filters';
import CategoryTable from './table';

export default function AssetList({ data }: { data: Array<Asset> }) {
  const [filters, setFilters] = useState({
    search: '',
    category: ALL.value,
    condition: ALL.value,
  });

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.category === ALL.value || item.category === filters.category;
    const matchesCondition =
      filters.condition === ALL.value || item.condition === filters.condition;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  return (
    <>
      <Fitlers filters={filters} setFilters={setFilters} />
      <CategoryTable items={filteredData} />
    </>
  );
}
