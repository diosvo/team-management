'use client';

import { useMemo } from 'react';

import { TestResult } from '@/types/periodic-testing';
import { useCommonParams } from '@/utils/filters';

import PlayerPerformanceMatrix from './PlayerPerformanceMatrix';
import TestingFilters from './TestingFilters';
import TestingStats from './TestingStats';

export default function TestingResultList({ result }: { result: TestResult }) {
  const [{ q }] = useCommonParams();

  const filteredPlayers = useMemo(() => {
    const players = result.players;
    if (!players || players.length === 0) return [];
    if (!q) return players;

    return players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(q.toLowerCase())
    );
  }, [q, result.players]);

  return (
    <>
      <TestingStats
        stats={{
          completed_tests: result.headers.length,
          total_players: result.players.length,
        }}
      />
      <TestingFilters />
      <PlayerPerformanceMatrix
        result={{ headers: result.headers, players: filteredPlayers }}
      />
    </>
  );
}
