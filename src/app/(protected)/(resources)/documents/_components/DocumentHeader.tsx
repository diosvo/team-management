'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertDocument } from './UpsertDocument';

export default function DocumentHeader() {
  const t = useTranslations('documents');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="documents"
        onClick={() =>
          UpsertDocument.open('add-document', {
            action: 'Add',
            item: { document_id: '' },
          })
        }
      />
    </PageHeader>
  );
}
