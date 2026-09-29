'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertLeague } from './UpsertLeague';

export default function LeagueHeader() {
  return (
    <PageHeader title="Leagues">
      <AddButton
        resource="leagues"
        onClick={() =>
          UpsertLeague.open('add-league', {
            action: 'Add',
            item: { league_id: '' },
          })
        }
      />
    </PageHeader>
  );
}
