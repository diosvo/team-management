import type { Metadata } from 'next';
import { forbidden } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { canCreateTestResult } from '@/actions/test-result';
import PageTitle from '@/components/PageTitle';

import AddTestResultPageClient from './_components/AddTestResultPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('periodicTesting.addResult.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function AddTestResultPage() {
  const isAllowed = await canCreateTestResult();

  if (!isAllowed) forbidden();

  const t = await getTranslations('periodicTesting.addResult');

  return (
    <>
      <PageTitle title={t('title')} />
      <AddTestResultPageClient />
    </>
  );
}
