import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import { getAssets } from '@/features/asset/actions/asset';
import AssetList from './_components/list';
import AssetStats from './_components/stats';

export const metadata: Metadata = {
  title: 'Assets',
  description: 'Assets inventory for the team.',
};

export default async function AssetsPage() {
  const { stats, data } = await getAssets();

  return (
    <>
      <PageTitle>Assets</PageTitle>
      <>
        <AssetStats stats={stats} />
        <AssetList data={data} />
      </>
    </>
  );
}
