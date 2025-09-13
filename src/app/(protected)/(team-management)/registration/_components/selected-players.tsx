'use client';

import { useState } from 'react';

import { Center } from '@chakra-ui/react';

import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/drizzle/schema';

export default function SelectedPlayers({ players }: { players: Array<User> }) {
  const [selection, setSelection] = useState<Array<string>>([]);

  const items = players.map(
    ({ user_id, name, details: { jersey_number = null } }) => (
      <Checkbox
        key={user_id}
        checked={selection.includes(user_id)}
        onCheckedChange={(changes) => {
          setSelection((prev) =>
            changes.checked
              ? [...prev, user_id]
              : selection.filter((id) => id !== user_id)
          );
        }}
      >
        {jersey_number && `${jersey_number} · `}
        {name}
      </Checkbox>
    )
  );

  return items.length > 0 ? items : <Center>No players selected.</Center>;
}
