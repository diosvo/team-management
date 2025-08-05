'use client';

import { useMemo } from 'react';

import {
  Combobox,
  Portal,
  Text,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';

import { User } from '@/drizzle/schema/user';

interface PlayerSelectionProps {
  maxPlayers: number;
  players: Array<User>;
  selection: Array<User>;
  onSelectionChange: (selected: Array<User>) => void;
}

export default function PlayerSelection({
  players,
  maxPlayers,
  selection,
  onSelectionChange,
}: PlayerSelectionProps) {
  const { contains } = useFilter({ sensitivity: 'base' });

  const { collection, filter, reset } = useListCollection({
    initialItems: players,
    filter: contains,
    // https://chakra-ui.com/docs/components/combobox#custom-objects
    itemToString: (player) => player.name,
    itemToValue: (player) => player.user_id,
  });

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
          (max {maxPlayers})
        </Text>
        <Text as="span" fontSize="xs" color="GrayText" marginLeft="auto">
          {selection.length} selected
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
            {collection.items.map((player) => (
              <Combobox.Item item={player} key={player.user_id}>
                <Combobox.ItemText truncate>
                  {player.details?.jersey_number
                    ? `${player.details.jersey_number} · `
                    : ''}
                  {player.name}
                </Combobox.ItemText>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
