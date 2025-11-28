'use client';

import { useMemo } from 'react';

import { Button, Clipboard } from '@chakra-ui/react';

import { User } from '@/drizzle/schema';

const HEADERS = ['Họ tên', 'Năm sinh', 'CMND', 'Điện thoại', 'Số áo'];

export default function CopyButton({ players }: { players: Array<User> }) {
  const value = useMemo(
    () =>
      [
        HEADERS.join(','),
        ...players.map(
          ({ name, dob, citizen_identification, phone_number, player }) =>
            [
              name,
              dob ? new Date(dob).getFullYear() : '',
              citizen_identification ?? '',
              phone_number ?? '',
              player?.jersey_number ?? '',
            ].join(','),
        ),
      ].join('\n'),
    [players],
  );

  return (
    <Clipboard.Root value={value} marginLeft="auto">
      <Clipboard.Trigger asChild>
        <Button variant="surface" disabled={!players.length}>
          <Clipboard.Indicator />
          <Clipboard.CopyText />
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}
