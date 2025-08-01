'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { TestResult } from '@/features/periodic-testing/db/test-result';

import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

export default function TestingResultList({
  dates,
  result,
}: {
  dates: Array<string>;
  result: TestResult;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: '',
    date: dates.length > 0 ? dates[0] : '',
  });

  const filteredPlayers = useMemo(() => {
    return result.players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [filters.search, result.players]);

  useEffect(() => {
    router.replace(`?date=${filters.date}`);
  }, [filters.date]);

  return (
    <>
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />
      <TestingFilters dates={dates} filters={filters} setFilters={setFilters} />
      <PlayerPerformanceMatrix
        result={{
          headers: result.headers,
          players: filteredPlayers,
        }}
      />
    </>
  );
}
