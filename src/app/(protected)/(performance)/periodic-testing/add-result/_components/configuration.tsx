'use client';

import PlayerSelection from '@/components/player-selection';
import { TestType, User } from '@/drizzle/schema';
import { useState } from 'react';

export default function TestResultConfiguration({
  players,
  types,
}: {
  players: Array<User>;
  types: Array<TestType>;
}) {
  const [selection, setSelection] = useState({
    players: [] as Array<User>,
    testTypes: [] as Array<TestType>,
  });

  return (
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
  );
}
