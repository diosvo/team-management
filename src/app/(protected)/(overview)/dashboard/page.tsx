import PageTitle from '@/components/page-title';
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <Suspense fallback={<div>Loading...</div>}>
        <div>Dashboard content goes here.</div>
      </Suspense>
    </>
  );
}
