'use client';

import { GridItem, Heading, SimpleGrid } from '@chakra-ui/react';

import SearchInput from '@/components/SearchInput';

import { MatchWithTeams } from '@/types/match';
import { useMatchFilters } from '@/utils/filters';

import MatchTable from './MatchTable';

export default function MatchList({
  matches,
}: {
  matches: Array<MatchWithTeams>;
}) {
  const [{ q }] = useMatchFilters();
  const filteredMatches = matches.filter(({ away_team }) =>
    away_team.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <SimpleGrid columns={2} marginBottom={6}>
        <GridItem>
          <Heading>All results</Heading>
        </GridItem>
        <GridItem>
          <SearchInput />
        </GridItem>
      </SimpleGrid>
      <MatchTable matches={filteredMatches} />
    </>
  );
}
