'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    router.push(`?date=${filters.date}`);
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
        result={result}
        searchTerm={filters.search}
        onUpdateScore={() => {}}
      />
    </>
  );
}
