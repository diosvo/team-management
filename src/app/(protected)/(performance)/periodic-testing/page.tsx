import { Metadata } from 'next';

import { VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import { getTestResult } from '@/features/periodic-testing/actions/test-result';
import PeriodicTestingPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage() {
  const result = await getTestResult('12/12/2025');

  return (
    <VStack align="stretch">
      <PageTitle>Periodic Testing</PageTitle>

      <PeriodicTestingPageClient result={result} />
    </VStack>
  );
}
