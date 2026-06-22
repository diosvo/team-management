'use client';

import { TestType } from '@/drizzle/schema';

import { useCommonParams } from '@/lib/nuqs';

import TestTypesFilters from './TestTypesFilters';
import TestTypesTable from './TestTypesTable';
import { UpsertTestType } from './UpsertTestType';

export default function TestTypesList({ data }: { data: Array<TestType> }) {
  const [{ q }] = useCommonParams();

  const filteredData = data.filter(({ name }) =>
    name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <TestTypesFilters />
      <TestTypesTable data={filteredData} />
      <UpsertTestType.Viewport />
    </>
  );
}
