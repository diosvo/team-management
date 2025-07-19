import { Metadata } from 'next';

import { VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import { getTestResult } from '@/features/periodic-testing/actions/test-result';
import TestingStats from './_components/stats';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage() {
  // Fetch only essential data on the server
  // Mappings will be fetched client-side with caching
  const results = await getTestResult('12/12/2025');

  console.log(results);

  return (
    <VStack align="stretch">
      <PageTitle>Periodic Testing</PageTitle>
      <TestingStats
        stats={{
          completed_tests: 1,
          next_test_in_days: 30,
          total_players: 10,
        }}
      />

      {/* <PeriodicTestingPageClient initialData={initialData} /> */}
    </VStack>
  );
}
