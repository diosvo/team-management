'use client';

import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

export default function PeriodicTestingPageClient({ result }: { result: any }) {
  return (
    <>
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />

      <TestingFilters
        onFilterChange={() => {}}
        onAddResult={() => {}}
        onAddMultipleResults={() => {}}
      />

      <PlayerPerformanceMatrix
        result={result}
        searchTerm={''}
        onUpdateScore={() => {}}
      />
    </>
  );
}
