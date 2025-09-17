import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import TestingResultList from './_components/list';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default function PeriodicTestingPage() {
  return (
    <>
      <PageTitle>Periodic Testing</PageTitle>
      <TestingResultList />
    </>
  );
}
