'use client';

import { useCallback } from 'react';

import { Box, BoxProps, List, Span } from '@chakra-ui/react';
import { UserRoundX } from 'lucide-react';

import { User } from '@/drizzle/schema/user';

import SearchableSelect from '@/components/SearchableSelect';
import { EmptyState } from '@/components/ui/empty-state';

import { getActivePlayers } from '@/actions/user';
import { CACHE_KEY } from '@/utils/constant';

type UserSelector = Selector<Array<User>>;

export function PlayerSelection({
  selection,
  onSelectionChange,
}: UserSelector) {
  return (
    <SearchableSelect
      controlledMode={false}
      multiple={true}
      label={CACHE_KEY.PLAYERS}
      action={getActivePlayers}
      fieldProps={{ required: true }}
      itemToString={({ name }) => name}
      itemToValue={({ id }) => id}
      renderItem={PlayerItem}
      value={selection}
      onChange={onSelectionChange}
    />
  );
}

export function SelectedPlayers({
  selection,
  onSelectionChange,
  ...props
}: UserSelector & BoxProps) {
  const handleRemovePlayer = useCallback(
    (id: string) =>
      onSelectionChange(
        selection.filter(({ id: player_id }) => id !== player_id),
      ),
    [selection],
  );

  return (
    <Box {...props}>
      {selection.length > 0 ? (
        <List.Root paddingInline={6} paddingBlock={4}>
          {selection.map((user: User) => (
            <List.Item
              key={user.id}
              width="max-content"
              _hover={{
                cursor: 'pointer',
                color: 'tomato',
                textDecoration: 'line-through',
                transition: 'all 0.2s',
              }}
              onClick={() => handleRemovePlayer(user.id)}
            >
              {PlayerItem(user)}
            </List.Item>
          ))}
        </List.Root>
      ) : (
        <EmptyState
          size="sm"
          title="No players selected"
          icon={<UserRoundX />}
        />
      )}
    </Box>
  );
}

function PlayerItem(user: User) {
  return (
    <>
      <Span color="GrayText">
        {user.player?.jersey_number && `${user.player.jersey_number} - `}
      </Span>
      {user.name}
    </>
  );
}
