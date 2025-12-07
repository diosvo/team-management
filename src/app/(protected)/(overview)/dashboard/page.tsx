import PageTitle from '@/components/PageTitle';
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <>
      <PageTitle title="Dashboard" />
      <Suspense fallback={<div>Loading...</div>}>
        <div>Dashboard content goes here.</div>
      </Suspense>
    </>
  );
}
