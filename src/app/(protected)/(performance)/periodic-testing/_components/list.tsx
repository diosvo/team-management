'use client';

import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

interface TestingResultListProps {
  dates: Array<{ date: string }>;
}

export default function TestingResultList({ dates }: TestingResultListProps) {
  return (
    <>
      <TestingStats
        stats={{
          // completed_tests: result.headers.length,
          // total_players: result.players.length,
          completed_tests: 1,
          total_players: 1,
        }}
      />
      <TestingFilters dates={dates} onFilterChange={() => {}} />
      <PlayerPerformanceMatrix
        result={{
          headers: [],
          players: [],
        }}
        searchTerm={''}
        onUpdateScore={() => {}}
      />
    </>
  );
}
