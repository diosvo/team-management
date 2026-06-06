import { Metadata } from 'next';

import { getLeagues } from '@/actions/league';

import LeagueFilters from './_components/LeagueFilters';
import LeagueHeader from './_components/LeagueHeader';
import LeagueTable from './_components/LeagueTable';

export const metadata: Metadata = {
  title: 'Leagues',
  description: 'Manage and view leagues information.',
};

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <>
      <LeagueHeader />
      <LeagueFilters leagues={leagues} />
      <LeagueTable leagues={leagues} />
    </>
  );
}
