'use client';

import { useRef, useState } from 'react';

import {
  Box,
  Button,
  Card,
  Flex,
  Highlight,
  HStack,
  Input,
  RadioGroup,
  SimpleGrid,
  Stack,
  Tag,
  Text,
} from '@chakra-ui/react';
import { Eye } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Field } from '@/components/ui/field';
import { Tooltip } from '@/components/ui/tooltip';

import { User } from '@/drizzle/schema/user';

import { GameTypeSelection } from '@/utils/constant';
import { GameType } from '@/utils/enum';

import PlayerSelection from '@/components/player-selection';
import ExportButton from './export-button';
import PreviewForm from './preview-form';

export default function RegistrationPageClient({
  users,
}: {
  users: Array<User>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState({
    name: '',
    type: GameType['5x5'],
    maxPlayers: 15,
  });
  const [players, setPlayers] = useState<Array<User>>([]);

  return (
    <Stack gap={6}>
      <Flex justify="space-between" alignItems="center">
        <PageTitle>Tournament Registration</PageTitle>
        <ExportButton info={info} players={players} contentRef={contentRef} />
      </Flex>

      <Stack gap={6}>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <Card.Root size="sm">
            <Card.Header>
              <Card.Title>
                <Button
                  size="2xs"
                  fontSize={16}
                  borderRadius="full"
                  marginRight={2}
                >
                  1
                </Button>
                Tournament Information
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} alignItems="flex-start">
                <Field label="Name" flex={1} required>
                  <Input
                    value={info.name}
                    onChange={(e) =>
                      setInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Box flex={1}>
                  <Text color="GrayText" fontSize={14}>
                    Game Type
                  </Text>
                  <RadioGroup.Root
                    value={info.type}
                    onValueChange={({ value }) => {
                      const gameType = value as GameType;
                      const maxPlayers = value === GameType['3x3'] ? 5 : 15;

                      setInfo((prev) => ({
                        ...prev,
                        type: gameType,
                        maxPlayers,
                      }));
                      // Remove excess players if switching to a game type with fewer max players
                      if (players.length > maxPlayers) {
                        setPlayers(players.slice(0, maxPlayers));
                      }
                    }}
                    marginTop={2}
                  >
                    <HStack gap={4} align="start">
                      {Object.values(GameTypeSelection).map((item) => (
                        <RadioGroup.Item key={item.value} value={item.value}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <Tooltip content={'max ' + item.max + ' players'}>
                            <RadioGroup.ItemText>
                              {item.label}
                            </RadioGroup.ItemText>
                          </Tooltip>
                        </RadioGroup.Item>
                      ))}
                    </HStack>
                  </RadioGroup.Root>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root size="sm">
            <Card.Header>
              <Card.Title>
                <Button
                  size="2xs"
                  fontSize={16}
                  borderRadius="full"
                  marginRight={2}
                >
                  2
                </Button>
                Player Selection
              </Card.Title>
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
                players={users}
                maxPlayers={info.maxPlayers}
                selection={players}
                onSelectionChange={setPlayers}
              />
            </Card.Body>
          </Card.Root>

          <Card.Root size="sm">
            <Card.Header>
              <Card.Description
                textAlign="right"
                color={players.length > info.maxPlayers ? 'tomato' : 'GrayText'}
              >
                {players.length} / {info.maxPlayers} selected players
              </Card.Description>
            </Card.Header>
            <Card.Body>
              <Flex flexWrap="wrap" gap={2}>
                {players.map((user) => (
                  <Tag.Root
                    key={user.user_id}
                    size="lg"
                    borderRadius="full"
                    width="max-content"
                  >
                    <Tag.Label>{user.name}</Tag.Label>
                    <Tag.EndElement>
                      <Tag.CloseTrigger
                        onClick={() =>
                          setPlayers(
                            players.filter(
                              ({ user_id }) => user_id !== user.user_id
                            )
                          )
                        }
                      />
                    </Tag.EndElement>
                  </Tag.Root>
                ))}
              </Flex>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Card.Root size="sm">
          <Card.Body>
            <Card.Title>
              <HStack>
                <Tooltip
                  content="💡 This is a preview of your registration form"
                  disabled
                >
                  <Eye size={20} color="blue" />
                </Tooltip>
                Preview Form
              </HStack>
            </Card.Title>
            <Card.Body
              maxHeight="calc(100vh - 450px)"
              overflow="hidden"
              overflowY="scroll"
            >
              <PreviewForm
                info={info}
                players={players}
                contentRef={contentRef}
              />
            </Card.Body>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Stack>
  );
}
