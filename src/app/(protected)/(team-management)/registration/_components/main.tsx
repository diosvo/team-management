'use client';

import { useState } from 'react';

import {
  Card,
  Flex,
  Highlight,
  IconButton,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import { Trash } from 'lucide-react';

import PageTitle from '@/components/page-title';
import PlayerSelection from '@/components/user/player-selection';

import { User } from '@/drizzle/schema/user';

import CopyButton from './export-button';
import SelectedPlayers from './selected-players';

export default function RegistrationPageClient() {
  const [info, setInfo] = useState({
    leagueName: '', // TODO: A dropdown that selects "League" name
    maxPlayers: 15,
  });
  const [players, setPlayers] = useState<Array<User>>([]);

  return (
    <Stack gap={6}>
      <Flex justify="space-between" alignItems="center">
        <PageTitle>Tournament Registration</PageTitle>
        <CopyButton players={players} />
      </Flex>

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
            <Card.Body>
              <PlayerSelection
                maxPlayers={info.maxPlayers}
                selection={players}
                onSelectionChange={setPlayers}
              />
            </Card.Body>
          </Card.Root>

          <Card.Root size="sm">
            <Card.Header>
              <IconButton
                marginLeft="auto"
                size="xs"
                variant="outline"
                colorPalette="red"
                aria-label="Clear"
                onClick={() => setPlayers([])}
              >
                <Trash />
              </IconButton>
            </Card.Header>
            <Card.Body>
              <SelectedPlayers players={players} />
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
