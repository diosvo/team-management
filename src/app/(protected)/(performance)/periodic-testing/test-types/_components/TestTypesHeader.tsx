'use client';

import { useTranslations } from 'next-intl';

import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesHeader() {
  const t = useTranslations('periodicTesting.testTypes');
  const tCommon = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <AddButton
        resource="periodic-testing"
        onClick={() =>
          UpsertTestType.open('add-test-type', {
            action: 'Add',
            item: { type_id: '' },
          })
        }
      >
        {tCommon('add')}
      </AddButton>
    </PageHeader>
  );
}
