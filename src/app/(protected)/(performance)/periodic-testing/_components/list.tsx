'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SkeletonText } from '@chakra-ui/react';

import { getTestResult } from '@/features/periodic-testing/actions/test-result';
import useQuery from '@/hooks/use-query';

import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

export default function TestingResultList() {
  const searchParams = useSearchParams();
  const date = searchParams.get('date') || '';
  const [search, setSearch] = useState<string>('');

  const { loading, data } = useQuery(
    async () => await getTestResult(date),
    [date],
    {
      enabled: !!date,
    }
  );

  const headers = data?.headers || [];
  const players = data?.players || [];

  const filteredPlayers = useMemo(() => {
    if (!players || players.length === 0) return [];
    if (!search) return players;

    return players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, players]);

  return (
    <>
      <TestingStats
        stats={{
          completed_tests: headers.length,
          total_players: players.length,
        }}
      />
      <TestingFilters date={date} search={search} setSearch={setSearch} />
      {loading ? (
        <SkeletonText noOfLines={9} />
      ) : (
        <PlayerPerformanceMatrix
          result={{ headers, players: filteredPlayers }}
        />
      )}
    </>
  );
}
