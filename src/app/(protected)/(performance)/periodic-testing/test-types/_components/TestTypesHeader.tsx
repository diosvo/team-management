'use client';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesHeader() {
  return (
    <PageHeader title="Test Types">
      <AddButton
        resource="periodic-testing"
        onClick={() =>
          UpsertTestType.open('add-test-type', {
            action: 'Add',
            item: { type_id: '' },
          })
        }
      />
    </PageHeader>
  );
}
