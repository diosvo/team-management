import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import { getTestResult } from '@/features/periodic-testing/actions/test-result';
import { getTestTypes } from '@/features/periodic-testing/actions/test-type';
import PeriodicTestingPageClient from './_components/main';
import TestingStats from './_components/stats';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage() {
  const result = await getTestResult('12/12/2025');
  const allTestTypes = await getTestTypes();

  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>

      <>
        <TestingStats
          stats={{
            completed_tests: result.headers.length,
            total_players: result.players.length,
          }}
        />
        <PeriodicTestingPageClient result={result} testTypes={allTestTypes} />
      </>
    </>
  );
}
