'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertLocation } from './UpsertLocation';

export default function LocationHeader() {
  const t = useTranslations('locations');
  const tCommon = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="locations"
        onClick={() =>
          UpsertLocation.open('add-location', {
            action: 'Add',
            item: { location_id: '' },
          })
        }
      >
        {tCommon('add')}
      </AddButton>
    </PageHeader>
  );
}
