'use client';

import { useMemo } from 'react';

import { TestResult } from '@/types/periodic-testing';
import { usePeriodicTestingFilters } from '@/utils/filters';

import PlayerPerformanceMatrix from './PlayerPerformanceMatrix';
import TestingFilters from './TestingFilters';
import TestingStats from './TestingStats';

export default function TestingResultList({ result }: { result: TestResult }) {
  const [{ q }] = usePeriodicTestingFilters();
  const { headers, players } = result;

  const filteredPlayers = useMemo(() => {
    if (players.length === 0) return [];
    if (!q) return players;

    return players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(q.toLowerCase()),
    );
  }, [q, players]);

  return (
    <>
      <TestingStats
        stats={{
          completed_tests: headers.length,
          total_players: players.length,
        }}
      />
      <TestingFilters />
      <PlayerPerformanceMatrix result={{ headers, players: filteredPlayers }} />
    </>
  );
}
