import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getTestDates, getTestResult } from '@/actions/test-result';
import { loadPeriodicTestingFilters } from '@/lib/nuqs';

import PlayerPerformanceMatrix from './_components/PlayerPerformanceMatrix';
import TestingFilters from './_components/TestingFilters';
import TestingHeader from './_components/TestingHeader';
import TestingStats from './_components/TestingStats';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('periodicTesting.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function PeriodicTestingPage({
  searchParams,
}: PageProps<'/periodic-testing'>) {
  const { date } = await loadPeriodicTestingFilters(searchParams);
  const [result, dates] = await Promise.all([
    getTestResult(date),
    getTestDates(),
  ]);

  return (
    <>
      <TestingHeader />
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />
      <TestingFilters dates={dates} />
      <PlayerPerformanceMatrix result={result} />
    </>
  );
}
