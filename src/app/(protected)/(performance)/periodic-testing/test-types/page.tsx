import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getTestTypes } from '@/actions/test-type';

import TestTypesFilters from './_components/TestTypesFilters';
import TestTypesHeader from './_components/TestTypesHeader';
import TestTypesTable from './_components/TestTypesTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('periodicTesting.testTypes.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function TestTypesPage() {
  const data = await getTestTypes();

  return (
    <>
      <TestTypesHeader />
      <TestTypesFilters />
      <TestTypesTable data={data} />
    </>
  );
}
