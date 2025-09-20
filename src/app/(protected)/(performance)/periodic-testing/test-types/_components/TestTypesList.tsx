'use client';

import { useMemo, useState } from 'react';

import { TestType } from '@/drizzle/schema';

import TestTypesFilters from './TestTypesFilters';
import TestTypesTable from './TestTypesTable';
import { UpsertTestType } from './UpsertTestType';

export default function TestTypesList({ data }: { data: Array<TestType> }) {
  const [search, setSearch] = useState<string>('');

  const filteredData = useMemo(
    () =>
      data.filter(({ name }) =>
        name.toLowerCase().includes(search.toLowerCase())
      ),
    [data, search]
  );

  return (
    <>
      <TestTypesFilters search={search} setSearch={setSearch} />
      <TestTypesTable data={filteredData} />
      <UpsertTestType.Viewport />
    </>
  );
}
