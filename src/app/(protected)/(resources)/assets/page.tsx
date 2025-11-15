import { Metadata } from 'next';

import PageTitle from '@/components/page-title';

import { getAssets } from '@/actions/asset';
import AssetList from './_components/AssetList';
import AssetStats from './_components/AssetStats';

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
