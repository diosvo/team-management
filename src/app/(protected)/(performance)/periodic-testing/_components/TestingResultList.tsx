'use client';

import { useMemo, useState } from 'react';

import { TestResult } from '@/schemas/models';
import PlayerPerformanceMatrix from './PlayerPerformanceMatrix';
import TestingFilters from './TestingFilters';
import TestingStats from './TestingStats';

export default function TestingResultList({
  date,
  result,
}: {
  date: string;
  result: TestResult;
}) {
  const [search, setSearch] = useState<string>('');

  const filteredPlayers = useMemo(() => {
    const players = result.players;
    if (!players || players.length === 0) return [];
    if (!search) return players;

    return players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, result.players]);

  return (
    <>
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />
      <TestingFilters date={date} search={search} setSearch={setSearch} />
      <PlayerPerformanceMatrix
        result={{ headers: result.headers, players: filteredPlayers }}
      />
    </>
  );
}
