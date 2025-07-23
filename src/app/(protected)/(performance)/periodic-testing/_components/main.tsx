'use client';

import TestingFilters from './filters';
import PlayerPerformanceMatrix from './table';

export default function PeriodicTestingPageClient({
  result,
  testTypes,
}: {
  result: any;
  testTypes: Array<{ name: string; unit: string }>;
}) {
  return (
    <>
      <TestingFilters onFilterChange={() => {}} testTypes={testTypes} />
      <PlayerPerformanceMatrix
        result={result}
        searchTerm={''}
        onUpdateScore={() => {}}
      />
    </>
  );
}
