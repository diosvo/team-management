'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertMatch } from './UpsertMatch';

export default function MatchHeader() {
  const t = useTranslations('matches.header');
  const tc = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="matches"
        onClick={() =>
          UpsertMatch.open('add-match', {
            action: 'Add',
            item: { match_id: '' },
          })
        }
      >
        {tc('add')}
      </AddButton>
    </PageHeader>
  );
}
