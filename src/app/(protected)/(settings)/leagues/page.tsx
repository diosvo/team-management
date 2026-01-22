import { Metadata } from 'next';

import PageTitle from '@/components/PageTitle';

import { getLeagues } from '@/actions/league';
import LeagueList from './_components/LeagueList';

export const metadata: Metadata = {
  title: 'Leagues',
  description: 'Manage and view leagues information.',
};

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <>
      <PageTitle title="Leagues" />
      <LeagueList leagues={leagues} />
    </>
  );
}
