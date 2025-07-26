'use client';

import { useState } from 'react';

import { TestType } from '@/drizzle/schema';
import TestTypesFilters from './filters';
import TestTypesTable from './table';

export default function TestTypesList({ data }: { data: Array<TestType> }) {
  const [search, setSearch] = useState<string>('');

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TestTypesFilters search={search} setSearch={setSearch} />
      <TestTypesTable data={filteredData} />
    </>
  );
}
