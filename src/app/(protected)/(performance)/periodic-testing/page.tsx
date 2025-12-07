import { Metadata } from 'next';

import PageTitle from '@/components/PageTitle';
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
      <PageTitle title="Periodic Testing" />
      <TestingResultList result={result} />
    </>
  );
}
