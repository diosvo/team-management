'use client';

import { Button, Clipboard } from '@chakra-ui/react';

import { User } from '@/drizzle/schema';
import { useMemo } from 'react';

export default function CopyButton({ players }: { players: Array<User> }) {
  const value = useMemo(() => {
    return players
      .map((player) => `- ${player.name} ${player.dob} ${player.email}`)
      .join('\n');
  }, [players]);

  return (
    <Clipboard.Root value={value}>
      <Clipboard.Trigger asChild>
        <Button variant="surface" disabled={players.length === 0}>
          <Clipboard.Indicator />
          <Clipboard.CopyText />
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}
