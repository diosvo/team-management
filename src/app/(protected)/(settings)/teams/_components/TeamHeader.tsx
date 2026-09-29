'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertTeam } from './UpsertTeam';

export default function TeamHeader() {
  return (
    <PageHeader title="Teams">
      <AddButton
        resource="teams"
        onClick={() =>
          UpsertTeam.open('add-team', { action: 'Add', item: { team_id: '' } })
        }
      />
    </PageHeader>
  );
}
