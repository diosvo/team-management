'use client';

import { Box, BoxProps, List } from '@chakra-ui/react';
import { UserX } from 'lucide-react';

import { User } from '@/drizzle/schema/user';
import useQuery from '@/hooks/use-query';

import SearchableSelect from '@/components/SearchableSelect';
import { EmptyState } from '@/components/ui/empty-state';

import { getActivePlayers } from '@/actions/user';

type PlayerSelectionProps = Selector<Array<User>> &
  Partial<{
    maxPlayers: number;
    disabled: boolean;
    showHelperText: boolean;
    contentRef: React.RefObject<Nullable<HTMLDivElement>>;
  }>;

type SelectedPlayers = Selector<Array<User>> & BoxProps;

export function SelectedPlayers({
  selection,
  onSelectionChange,
  ...props
}: SelectedPlayers) {
  return (
    <Box {...props}>
      {selection.length > 0 ? (
        <List.Root paddingInline={8} paddingBlock={4}>
          {selection.map(({ id, name, details: { jersey_number = null } }) => (
            <List.Item
              key={id}
              width="max-content"
              _hover={{
                cursor: 'pointer',
                color: 'tomato',
                textDecoration: 'line-through',
                transition: 'all 0.2s',
              }}
              onClick={() =>
                onSelectionChange(
                  selection.filter(({ id: player_id }) => id !== player_id),
                )
              }
            >
              {jersey_number && `${jersey_number} - `}
              {name}
            </List.Item>
          ))}
        </List.Root>
      ) : (
        <EmptyState
          size="sm"
          title="No players selected"
          icon={<UserX />}
          description=""
        />
      )}
    </Box>
  );
}

export function PlayerSelection(props: PlayerSelectionProps) {
  const request = useQuery(async () => await getActivePlayers());

  return (
    <SearchableSelect
      label="players"
      request={request}
      itemToString={({ name }) => name}
      itemToValue={({ id }) => id}
      renderItem={({ details, name }) => (
        <>
          {details?.jersey_number && `${details.jersey_number} · `}
          {name}
        </>
      )}
      {...props}
    />
  );
}
