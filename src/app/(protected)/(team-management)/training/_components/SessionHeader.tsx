'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertSession } from './UpsertSession';

export default function SessionHeader() {
  return (
    <PageHeader title="Training Sessions">
      <AddButton
        resource="training"
        onClick={() =>
          UpsertSession.open('new-session', {
            action: 'Create',
            item: { session_id: '' },
          })
        }
      >
        New Session
      </AddButton>
    </PageHeader>
  );
}
