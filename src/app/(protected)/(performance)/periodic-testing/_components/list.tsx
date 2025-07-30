'use client';

import { useState } from 'react';
import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

export default function TestingResultList({ dates }: { dates: Array<string> }) {
  const [filters, setFilters] = useState({
    search: '',
    date: dates.length > 0 ? dates[0] : '',
  });

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
      <TestingFilters dates={dates} filters={filters} setFilters={setFilters} />
      <PlayerPerformanceMatrix
        result={{
          headers: [],
          players: [],
        }}
        searchTerm={filters.search}
        onUpdateScore={() => {}}
      />
    </>
  );
}
