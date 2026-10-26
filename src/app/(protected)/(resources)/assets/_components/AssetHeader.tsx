'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertAsset } from './UpsertAsset';

export default function AssetHeader() {
  const t = useTranslations('assets');
  const tCommon = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="assets"
        onClick={() =>
          UpsertAsset.open('add-asset', {
            action: 'Add',
            item: { asset_id: '' },
          })
        }
      >
        {tCommon('add')}
      </AddButton>
    </PageHeader>
  );
}
