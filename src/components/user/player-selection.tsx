'use client';

import { useMemo } from 'react';

import {
  Combobox,
  HStack,
  Portal,
  Spinner,
  Text,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';

import { User } from '@/drizzle/schema/user';
import useQuery from '@/hooks/use-query';
import { UserRole, UserState } from '@/utils/enum';

import { getRoster } from '@/features/user/actions/user';
import { FilterUsersValues } from '@/features/user/schemas/user';

interface PlayerSelectionProps {
  selection: Array<User>;
  onSelectionChange: (selected: Array<User>) => void;
  params?: FilterUsersValues;
  maxPlayers?: number;
}

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
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection, filter, set, reset } = useListCollection<User>({
    initialItems: [],
    filter: contains,
    // https://chakra-ui.com/docs/components/combobox#custom-objects
    itemToString: (player) => player.name,
    itemToValue: (player) => player.user_id,
  });

  const request = useQuery(async () => {
    const users = await getRoster(params);
    set(users);
    return users;
  });

  const max = useMemo(
    () => maxPlayers ?? collection.items.length,
    [maxPlayers, collection.items.length]
  );

  const selected = useMemo(
    () => selection.map((user) => user.user_id),
    [selection]
  );

  return (
    <Combobox.Root
      required
      multiple
      openOnClick
      value={selected}
      collection={collection}
      onValueChange={(details) => onSelectionChange(details.items)}
      onInputValueChange={(e) => filter(e.inputValue)}
    >
      <Combobox.Label display="flex">
        Select players
        <Text as="span" fontSize="xs" color="GrayText" marginLeft={2}>
          (max {max})
        </Text>
        <Text
          as="span"
          fontSize="xs"
          color={selection.length > max ? 'tomato' : 'GrayText'}
          marginLeft="auto"
        >
          {selection.length} / {max} selected players
        </Text>
      </Combobox.Label>

      <Combobox.Control>
        <Combobox.Input placeholder="Type to search" />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger onClick={reset} />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No players found</Combobox.Empty>
            {request.loading ? (
              <HStack padding={2}>
                <Spinner size="xs" borderWidth={1} />
                <Text>Loading...</Text>
              </HStack>
            ) : request.error ? (
              <Text padding={2} color="fg.error">
                {request.error.message}
              </Text>
            ) : (
              collection.items.map((player) => (
                <Combobox.Item item={player} key={player.user_id}>
                  <Combobox.ItemText truncate>
                    {player.details?.jersey_number
                      ? `${player.details.jersey_number} · `
                      : ''}
                    {player.name}
                  </Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
