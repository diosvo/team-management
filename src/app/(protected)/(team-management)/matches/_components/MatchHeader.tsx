'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertMatch } from './UpsertMatch';

export default function MatchHeader() {
  return (
    <PageHeader title="Matches">
      <AddButton
        resource="matches"
        onClick={() =>
          UpsertMatch.open('add-match', {
            action: 'Add',
            item: { match_id: '' },
          })
        }
      />
    </PageHeader>
  );
}
