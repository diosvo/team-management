import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import { getTestResult } from '@/features/periodic-testing/actions/test-result';

import TestingResultList from './_components/list';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage(props: {
  searchParams: Promise<{ date: string }>;
}) {
  const { date = '' } = await props.searchParams;
  const result = await getTestResult(date);

  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>
      <TestingResultList date={date} result={result} />
    </>
  );
}
