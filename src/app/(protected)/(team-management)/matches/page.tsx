import { Metadata } from 'next';

import { HStack } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { getMatches } from '@/actions/match';
import { loadMatchFilters } from '@/utils/filters';

import MatchesFilters from './_components/MatchFilters';
import MatchList from './_components/MatchList';
import MatchesStats from './_components/MatchStats';

export const metadata: Metadata = {
  title: 'Matches',
  description: 'Manage and view team matches information.',
};

export default async function MatchesPage(props: PageProps<'/matches'>) {
  const params = await loadMatchFilters(props.searchParams);
  const { stats, data } = await getMatches(params);

  return (
    <>
      <HStack justifyContent="space-between" marginBottom={6}>
        <PageTitle title="Matches" />
        <MatchesFilters />
      </HStack>
      <MatchesStats stats={stats} />
      <MatchList matches={data} />
    </>
  );
}
