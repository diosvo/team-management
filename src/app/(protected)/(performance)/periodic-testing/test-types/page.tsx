import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getTestTypes } from '@/actions/test-type';

import TestTypeFilters from './_components/TestTypeFilters';
import TestTypeHeader from './_components/TestTypeHeader';
import TestTypeTable from './_components/TestTypeTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('periodicTesting.testTypes.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function TestTypesPage() {
  const data = await getTestTypes();

  return (
    <>
      <TestTypeHeader />
      <TestTypeFilters />
      <TestTypeTable data={data} />
    </>
  );
}
