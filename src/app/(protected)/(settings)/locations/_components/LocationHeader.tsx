'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertLocation } from './UpsertLocation';

export default function LocationHeader() {
  return (
    <PageHeader title="Locations">
      <AddButton
        resource="locations"
        onClick={() =>
          UpsertLocation.open('add-location', {
            action: 'Add',
            item: { location_id: '' },
          })
        }
      />
    </PageHeader>
  );
}
