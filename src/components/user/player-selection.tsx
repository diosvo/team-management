'use client';

import { User } from '@/drizzle/schema/user';
import useQuery from '@/hooks/use-query';
import { UserRole, UserState } from '@/utils/enum';

import SearchableSelect from '@/components/searchable-select';

import { getRoster } from '@/actions/user';
import { FilterUsersValues } from '@/schemas/user';

type PlayerSelectionProps = Selector<Array<User>> &
  Partial<{
    maxPlayers: number;
    params: FilterUsersValues;
  }>;

export default function PlayerSelection({
  params = {
    query: '',
    role: [UserRole.PLAYER],
    state: [UserState.ACTIVE],
  },
  maxPlayers,
  selection,
  onSelectionChange,
}: PlayerSelectionProps) {
  const request = useQuery(async () => await getRoster(params));

  return (
    <SearchableSelect
      label="players"
      request={request}
      maxItems={maxPlayers}
      itemToString={(player) => player.name}
      itemToValue={(player) => player.id}
      renderItem={(player) => (
        <>
          {player.details?.jersey_number &&
            `${player.details.jersey_number} · `}
          {player.name}
        </>
      )}
      selection={selection}
      onSelectionChange={onSelectionChange}
    />
  );
}
