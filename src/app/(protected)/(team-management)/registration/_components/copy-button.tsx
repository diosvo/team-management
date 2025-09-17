'use client';

import { useMemo } from 'react';

import { Button, Clipboard } from '@chakra-ui/react';

import { User } from '@/drizzle/schema';

export default function CopyButton({ players }: { players: Array<User> }) {
  const headers = ['Họ tên', 'Năm sinh', 'CMND', 'Điện thoại', 'Số áo'];
  const value = useMemo(
    () =>
      [
        headers.join(','),
        ...players.map(
          ({
            name,
            dob = new Date(),
            citizen_identification,
            phone_number,
            details: { jersey_number },
          }) =>
            [
              name,
              dob ? new Date(dob).getFullYear() : '',
              citizen_identification ?? '',
              phone_number ?? '',
              jersey_number ?? '',
            ].join(',')
        ),
      ].join('\n'),
    [players]
  );

  return (
    <Clipboard.Root value={value} marginLeft="auto">
      <Clipboard.Trigger asChild>
        <Button variant="surface" disabled={players.length === 0}>
          <Clipboard.Indicator />
          <Clipboard.CopyText />
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}
