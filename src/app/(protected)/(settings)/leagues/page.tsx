import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getLeagues } from '@/actions/league';

import LeagueFilters from './_components/LeagueFilters';
import LeagueHeader from './_components/LeagueHeader';
import LeagueTable from './_components/LeagueTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('leagues.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <>
      <LeagueHeader />
      <LeagueFilters />
      <LeagueTable leagues={leagues} />
    </>
  );
}
