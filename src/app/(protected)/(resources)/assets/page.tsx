import { Metadata } from 'next';

import PageTitle from '@/components/page-title';
import { AssetCategory, AssetCondition } from '@/utils/enum';

import AssetList from './_components/list';
import AssetStats from './_components/stats';

export const metadata: Metadata = {
  title: 'Assets',
  description: 'Assets inventory for the team.',
};

const MOCK_DATA = {
  stats: {
    total_items: 10,
    need_replacement: 1,
  },
  data: [
    {
      asset_id: 'eq-001',
      name: 'Ball #1',
      category: AssetCategory.EQUIPMENT,
      quantity: 1,
      condition: AssetCondition.GOOD,
      updated_at: new Date(),
      note: 'Used for EQUIPMENT',
    },

    {
      asset_id: 'tr-001',
      name: 'Cones',
      category: AssetCategory.TRANING,
      quantity: 5,
      condition: AssetCondition.POOR,
      updated_at: new Date(),
      note: 'Used for training',
    },
  ],
};

export default function AssetsPage() {
  return (
    <>
      <PageTitle>Assets</PageTitle>
      <AssetStats stats={MOCK_DATA.stats} />
      <AssetList data={MOCK_DATA.data} />
    </>
  );
}
