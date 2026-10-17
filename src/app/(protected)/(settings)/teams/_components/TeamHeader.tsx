'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertTeam } from './UpsertTeam';

export default function TeamHeader() {
  const t = useTranslations('teams');
  const tCommon = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="teams"
        onClick={() =>
          UpsertTeam.open('add-team', { action: 'Add', item: { team_id: '' } })
        }
      >
        {tCommon('add')}
      </AddButton>
    </PageHeader>
  );
}
