'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertAsset } from './UpsertAsset';

export default function AssetHeader() {
  return (
    <PageHeader title="Assets">
      <AddButton
        resource="assets"
        onClick={() =>
          UpsertAsset.open('add-asset', {
            action: 'Add',
            item: { asset_id: '' },
          })
        }
      />
    </PageHeader>
  );
}
