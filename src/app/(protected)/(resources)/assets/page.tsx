import { Metadata } from 'next';

import { getAssets } from '@/actions/asset';

import AssetFilters from './_components/AssetFilters';
import AssetHeader from './_components/AssetHeader';
import AssetStats from './_components/AssetStats';
import AssetTable from './_components/AssetTable';

export const metadata: Metadata = {
  title: 'Assets',
  description: 'Assets inventory for the team.',
};

export default async function AssetsPage() {
  const { stats, data } = await getAssets();

  return (
    <>
      <AssetHeader />
      <AssetStats stats={stats} />
      <AssetFilters />
      <AssetTable data={data} />
    </>
  );
}
