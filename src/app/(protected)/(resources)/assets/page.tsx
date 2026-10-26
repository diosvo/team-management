import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getAssets } from '@/actions/asset';

import AssetFilters from './_components/AssetFilters';
import AssetHeader from './_components/AssetHeader';
import AssetStats from './_components/AssetStats';
import AssetTable from './_components/AssetTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('assets.metadata');
  return { title: t('title'), description: t('description') };
}

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
