import { Metadata } from 'next';

import PageTitle from '@/components/PageTitle';

import CacheStoreTable from './_components/CacheStoreTable';

export const metadata: Metadata = {
  title: 'Cache Store',
  description: 'View and manage the SWR cache store.',
};

export default async function CacheStorePage() {
  return (
    <>
      <PageTitle title="SWR Store" />
      <CacheStoreTable />
    </>
  );
}
