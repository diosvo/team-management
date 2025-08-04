'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  TestFilters,
  TestResult,
} from '@/features/periodic-testing/schemas/models';

import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

export default function TestingResultList({
  dates,
  result,
  initialDate,
}: {
  dates: Array<string>;
  result: TestResult;
  initialDate: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    date: initialDate,
  });

  const filteredPlayers = useMemo(() => {
    return result.players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [filters.search, result.players]);

  useEffect(() => {
    router.push(`?date=${filters.date}`);
  }, [router, filters.date]);

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
