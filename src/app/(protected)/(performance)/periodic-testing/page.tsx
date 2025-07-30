import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import { getTestDates } from '@/features/periodic-testing/actions/test-result';

import TestingResultList from './_components/list';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage() {
  const dates = await getTestDates();

  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>
      <TestingResultList dates={dates} />
    </>
  );
}
