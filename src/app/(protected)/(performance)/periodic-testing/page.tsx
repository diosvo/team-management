import { Metadata } from 'next';

import PageTitle from '@/components/page-title';
import TestingResultList from './_components/TestingResultList';

import { getTestResult } from '@/actions/test-result';
import { loadPeriodicTestingFilters } from './search-params';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage({
  searchParams,
}: PageProps<'/periodic-testing'>) {
  const { date } = await loadPeriodicTestingFilters(searchParams);
  const result = await getTestResult(date);

  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>
      <TestingResultList result={result} />
    </>
  );
}
