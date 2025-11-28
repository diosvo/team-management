'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  Highlight,
  HStack,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';
import SearchableSelect from '@/components/SearchableSelect';
import {
  PlayerSelection,
  SelectedPlayers,
} from '@/components/user/PlayerSelection';

import { League } from '@/drizzle/schema';
import { User } from '@/drizzle/schema/user';

import { getLeagues } from '@/actions/league';
import useQuery from '@/hooks/use-query';

import CopyButton from './CopyButton';

export default function RegistrationPageClient() {
  const leagues = useQuery(getLeagues);

  const [league, setLeague] = useState<League>();
  const [selection, setSelection] = useState<Array<User>>([]);

  return (
    <Stack gap={6}>
      <HStack>
        <PageTitle title="Tournament Registration" />
        <CopyButton players={selection} />
      </HStack>

      <Stack gap={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Card.Root size="sm">
            <Card.Header>
              <Card.Title>General Information</Card.Title>
              <Card.Description>
                <Highlight
                  query="active"
                  styles={{ px: '0.5', backgroundColor: 'green.100' }}
                >
                  Only active players will be registered for the tournament.
                </Highlight>
              </Card.Description>
            </Card.Header>
            <Card.Body flexDirection="row" gap={4}>
              <PlayerSelection
                selection={selection}
                onSelectionChange={setSelection}
              />
              <SearchableSelect
                multiple={false}
                showHelperText={false}
                label="league"
                request={leagues}
                selection={league ? [league] : []}
                itemToString={({ name }) => name}
                itemToValue={({ league_id }) => league_id}
                onSelectionChange={(items) => setLeague(items[0])}
              />
            </Card.Body>
          </Card.Root>

          <Card.Root size="sm">
            <Card.Header>
              <HStack>
                <Card.Title>Selected Players</Card.Title>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  marginLeft="auto"
                  disabled={selection.length === 0}
                  onClick={() => setSelection([])}
                >
                  clear all
                </Button>
              </HStack>
            </Card.Header>
            <Card.Body>
              <SelectedPlayers
                selection={selection}
                onSelectionChange={setSelection}
              />
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
