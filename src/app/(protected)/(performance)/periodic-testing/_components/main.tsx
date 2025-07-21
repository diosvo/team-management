'use client';

import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

export default function PeriodicTestingPageClient({
  result,
  testTypes,
}: {
  result: any;
  testTypes: string[];
}) {
  return (
    <>
      <TestingStats
        stats={{
          test_date: '12/12/2025',
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />

      <TestingFilters
        onFilterChange={() => {}}
        onAddResult={() => {}}
        onAddMultipleResults={() => {}}
        testTypes={testTypes}
      />

      <PlayerPerformanceMatrix
        result={result}
        searchTerm={''}
        onUpdateScore={() => {}}
      />
    </>
  );
}
