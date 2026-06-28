import { Metadata } from 'next';

import { getTestDates, getTestResult } from '@/actions/test-result';
import { loadPeriodicTestingFilters } from '@/utils/filters';

import PlayerPerformanceMatrix from './_components/PlayerPerformanceMatrix';
import TestingFilters from './_components/TestingFilters';
import TestingHeader from './_components/TestingHeader';
import TestingStats from './_components/TestingStats';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage({
  searchParams,
}: PageProps<'/periodic-testing'>) {
  const { date } = await loadPeriodicTestingFilters(searchParams);
  const [result, dates] = await Promise.all([
    getTestResult(date),
    getTestDates(),
  ]);

  return (
    <>
      <TestingHeader />
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />
      <TestingFilters dates={dates} headers={result.headers} />
      <PlayerPerformanceMatrix result={result} />
    </>
  );
}
