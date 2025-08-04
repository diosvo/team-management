import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import {
  getTestDates,
  getTestResult,
} from '@/features/periodic-testing/actions/test-result';

import TestingResultList from './_components/list';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default async function PeriodicTestingPage(props: {
  searchParams: Promise<{ date: string }>;
}) {
  const { date = '' } = await props.searchParams;
  const dates = await getTestDates();

  // Get date from search params or default to the first available date
  const selectedDate = date || (dates.length > 0 ? dates[0] : '');
  const result = await getTestResult(selectedDate);

  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>
      <TestingResultList
        dates={dates}
        result={result}
        initialDate={selectedDate}
      />
    </>
  );
}
