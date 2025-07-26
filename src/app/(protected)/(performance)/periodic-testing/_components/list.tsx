'use client';

import TestingFilters from './filters';
import PlayerPerformanceMatrix from './table';

export default function TestingResultList({ result }: { result: any }) {
  return (
    <>
      <TestingFilters onFilterChange={() => {}} />
      <PlayerPerformanceMatrix
        result={result}
        searchTerm={''}
        onUpdateScore={() => {}}
      />
    </>
  );
}
