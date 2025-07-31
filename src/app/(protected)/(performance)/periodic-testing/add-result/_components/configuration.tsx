'use client';

import { Input, VStack } from '@chakra-ui/react';

import PlayerSelection from '@/components/player-selection';
import { Field } from '@/components/ui/field';

import { TestType, User } from '@/drizzle/schema';
import { ESTABLISHED_DATE } from '@/utils/constant';

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
    date: string;
  };
  setSelection: React.Dispatch<
    React.SetStateAction<{
      players: Array<User>;
      types: Array<TestType>;
      date: string;
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
      <Field label="Test Date" required>
        <Input
          type="date"
          min={ESTABLISHED_DATE}
          defaultValue={selection.date}
          onChange={(e) => {
            setSelection((prev) => ({
              ...prev,
              date: e.target.value,
            }));
          }}
        />
      </Field>
    </VStack>
  );
}
