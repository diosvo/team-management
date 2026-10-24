import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getProgression } from '@/actions/progression';
import { loadProgressionFilters } from '@/lib/nuqs';

import ProgressionFilters from './_components/ProgressionFilters';
import ProgressionHeader from './_components/ProgressionHeader';
import ProgressionStats from './_components/ProgressionStats';
import ProgressionTable from './_components/ProgressionTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('periodicTesting.progression.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function ProgressionPage({
  searchParams,
}: PageProps<'/periodic-testing/progression'>) {
  const { type } = await loadProgressionFilters(searchParams);
  const { types, progression } = await getProgression(type);

  return (
    <>
      <ProgressionHeader />
      <ProgressionStats progression={progression} />
      <ProgressionFilters
        types={types}
        selected={progression?.type.type_id ?? null}
      />
      <ProgressionTable progression={progression} />
    </>
  );
}
