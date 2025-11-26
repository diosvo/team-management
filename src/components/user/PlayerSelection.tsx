'use client';

import { User } from '@/drizzle/schema/user';
import useQuery from '@/hooks/use-query';

import { getActivePlayers } from '@/actions/user';
import SearchableSelect from '@/components/SearchableSelect';

type PlayerSelectionProps = Selector<Array<User>> &
  Partial<{ maxPlayers: number }>;

export default function PlayerSelection({
  maxPlayers,
  selection,
  onSelectionChange,
}: PlayerSelectionProps) {
  const request = useQuery(async () => await getActivePlayers());

  return (
    <SearchableSelect
      label="players"
      request={request}
      maxItems={maxPlayers}
      itemToString={({ name }) => name}
      itemToValue={({ id }) => id}
      renderItem={({ details, name }) => (
        <>
          {details?.jersey_number && `${details.jersey_number} · `}
          {name}
        </>
      )}
      selection={selection}
      onSelectionChange={onSelectionChange}
    />
  );
}
