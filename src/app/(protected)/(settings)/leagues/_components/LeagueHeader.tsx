'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertLeague } from './UpsertLeague';

export default function LeagueHeader() {
  const t = useTranslations('leagues');
  const tCommon = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="leagues"
        onClick={() =>
          UpsertLeague.open('add-league', {
            action: 'Add',
            item: { league_id: '' },
          })
        }
      >
        {tCommon('add')}
      </AddButton>
    </PageHeader>
  );
}
