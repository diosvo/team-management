import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import { getTestResult } from '@/features/periodic-testing/actions/test-result';

import TestingResultList from './_components/list';
import TestingStats from './_components/stats';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage() {
  const result = await getTestResult('12/12/2025');

  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />
      <TestingResultList result={result} />
    </>
  );
}
