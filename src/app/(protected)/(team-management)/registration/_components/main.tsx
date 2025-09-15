'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  Center,
  Highlight,
  HStack,
  List,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';

import PageTitle from '@/components/page-title';
import PlayerSelection from '@/components/user/player-selection';

import { User } from '@/drizzle/schema/user';

import CopyButton from './export-button';

export default function RegistrationPageClient() {
  const [info] = useState({
    leagueName: '', // TODO: A dropdown that selects "League" name
    maxPlayers: 15,
  });
  const [selection, setSelection] = useState<Array<User>>([]);

  return (
    <Stack gap={6}>
      <HStack>
        <PageTitle>Tournament Registration</PageTitle>
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
            <Card.Body>
              <PlayerSelection
                maxPlayers={info.maxPlayers}
                selection={selection}
                onSelectionChange={setSelection}
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
              {selection.length > 0 ? (
                <List.Root paddingInline={4}>
                  {selection.map(
                    ({ user_id, name, details: { jersey_number = null } }) => (
                      <List.Item
                        key={user_id}
                        width="max-content"
                        _hover={{
                          cursor: 'pointer',
                          color: 'tomato',
                          textDecoration: 'line-through',
                          transition: 'all 0.2s',
                        }}
                        onClick={() =>
                          setSelection((prev) =>
                            prev.filter(({ user_id: id }) => id !== user_id)
                          )
                        }
                      >
                        {jersey_number && `${jersey_number} - `}
                        {name}
                      </List.Item>
                    )
                  )}
                </List.Root>
              ) : (
                <Center>No players selected.</Center>
              )}
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
