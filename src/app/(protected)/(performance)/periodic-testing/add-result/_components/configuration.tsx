'use client';

import PlayerSelection from '@/components/player-selection';
import { TestType, User } from '@/drizzle/schema';
import { VStack } from '@chakra-ui/react';
import TestTypesSelection from './test-types-selection';

export default function TestResultConfiguration({
  players,
  types,
  selection,
  setSelection,
}: {
  players: Array<User>;
  types: Array<TestType>;
  selection: {
    players: Array<User>;
    types: Array<TestType>;
  };
  setSelection: React.Dispatch<
    React.SetStateAction<{
      players: Array<User>;
      types: Array<TestType>;
    }>
  >;
}) {
  return (
    <VStack gap={4}>
      <PlayerSelection
        players={players}
        maxPlayers={players.length}
        selection={selection.players}
        onSelectionChange={(selected) => {
          setSelection((prev) => ({
            ...prev,
            players: selected,
          }));
        }}
      />
      <TestTypesSelection
        data={types}
        selection={selection.types}
        onSelectionChange={(selected) => {
          setSelection((prev) => ({
            ...prev,
            types: selected,
          }));
        }}
      />
    </VStack>
  );
}
