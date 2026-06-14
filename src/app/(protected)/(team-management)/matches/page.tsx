import { Metadata } from 'next';

import { getMatches } from '@/actions/match';
import { loadMatchFilters } from '@/utils/filters';

import MatchFilters from './_components/MatchFilters';
import MatchHeader from './_components/MatchHeader';
import MatchStats from './_components/MatchStats';
import MatchTable from './_components/MatchTable';

export const metadata: Metadata = {
  title: 'Matches',
  description: 'Manage and view team matches information.',
};

export default async function MatchesPage(props: PageProps<'/matches'>) {
  const params = await loadMatchFilters(props.searchParams);
  const { stats, data } = await getMatches(params);

  return (
    <>
      <MatchHeader />
      <MatchStats stats={stats} />
      <MatchFilters />
      <MatchTable matches={data} />
    </>
  );
}
