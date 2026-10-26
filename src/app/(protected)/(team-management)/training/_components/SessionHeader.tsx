'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertSession } from './UpsertSession';

export default function SessionHeader() {
  const t = useTranslations('training.header');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="training"
        onClick={() =>
          UpsertSession.open('new-session', {
            action: 'Create',
            item: { session_id: '' },
          })
        }
      >
        {t('newSession')}
      </AddButton>
    </PageHeader>
  );
}
