import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getDocuments } from '@/actions/document';

import DocumentFilters from './_components/DocumentFilters';
import DocumentGrid from './_components/DocumentGrid';
import DocumentHeader from './_components/DocumentHeader';
import DocumentStats from './_components/DocumentStats';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('documents.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function DocumentsPage() {
  const { stats, data } = await getDocuments();

  return (
    <>
      <DocumentHeader />
      <DocumentStats stats={stats} />
      <DocumentFilters />
      <DocumentGrid data={data} />
    </>
  );
}
