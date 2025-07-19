'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Box,
  Button,
  Card,
  createListCollection,
  HStack,
  Input,
  Portal,
  Select,
  SimpleGrid,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, Save } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { useTestResultsStorage } from '../_hooks/use-test-results';

// Available test types that can be selected
const AVAILABLE_TEST_TYPES = [
  'Sprint Speed',
  'Endurance',
  'Vertical Jump',
  'Agility',
  'Strength',
  'Flexibility',
  'Coordination',
  'Balance',
  'Power',
  'Reaction Time',
];

// Sample player names - in a real app, this would come from your database
const AVAILABLE_PLAYERS = [
  'John Smith',
  'Sarah Johnson',
  'Mike Davis',
  'Emily Chen',
  'David Wilson',
  'Lisa Brown',
  'Chris Taylor',
  'Amanda White',
  'Kevin Lee',
  'Rachel Green',
  'Alex Martinez',
  'Jessica Clark',
  'Ryan Thompson',
  'Nicole Adams',
  'Brandon Hall',
];

interface TestResult {
  player_name: string;
  test_type: string;
  score: number;
  notes?: string;
}

export default function AddTestResultsPage() {
  const router = useRouter();
  const { addResults } = useTestResultsStorage();
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [testDate, setTestDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [playerResults, setPlayerResults] = useState<
    Record<string, Record<string, string>>
  >({});

  // Get today's date for validation
  const today = new Date().toISOString().split('T')[0];

  // Create collections for Select components
  const testTypesCollection = createListCollection({
    items: AVAILABLE_TEST_TYPES.map((type) => ({ value: type, label: type })),
  });

  const playersCollection = createListCollection({
    items: AVAILABLE_PLAYERS.map((player) => ({
      value: player,
      label: player,
    })),
  });

  // Handle test type selection
  const handleTestTypeSelection = (values: string[]) => {
    if (values.length > 5) {
      toaster.create({
        type: 'warning',
        description: 'Maximum 5 test types can be selected at once',
      });
      return;
    }
    setSelectedTestTypes(values);
  };

  // Handle player selection
  const handlePlayerSelection = (values: string[]) => {
    setSelectedPlayers(values);
  };

  // Handle score input
  const handleResultInput = (
    playerName: string,
    testType: string,
    field: 'score',
    value: string
  ) => {
    setPlayerResults((prev) => ({
      ...prev,
      [playerName]: {
        ...prev[playerName],
        [testType]: value,
      },
    }));
  };

  // Validate and submit results
  const handleSubmit = () => {
    if (selectedTestTypes.length === 0) {
      toaster.create({
        type: 'error',
        description: 'Please select at least one test type',
      });
      return;
    }

    if (!testDate) {
      toaster.create({
        type: 'error',
        description: 'Please select a test date',
      });
      return;
    }

    if (selectedPlayers.length === 0) {
      toaster.create({
        type: 'error',
        description: 'Please select at least one player',
      });
      return;
    }

    const results: TestResult[] = [];
    let hasErrors = false;

    selectedPlayers.forEach((playerName) => {
      selectedTestTypes.forEach((testType) => {
        const playerData = playerResults[playerName]?.[testType];
        const score = playerData?.trim();

        if (!score) {
          hasErrors = true;
          return;
        }

        const numericScore = parseFloat(score);
        if (isNaN(numericScore)) {
          hasErrors = true;
          return;
        }

        results.push({
          player_name: playerName,
          test_type: testType,
          score: numericScore,
        });
      });
    });

    if (hasErrors) {
      toaster.create({
        type: 'error',
        description:
          'Please fill in valid scores for all selected test types and players',
      });
      return;
    }

    // Submit results to storage and redirect
    addResults(results);

    toaster.create({
      type: 'success',
      description: `Successfully added ${results.length} test results`,
    });

    // Redirect back to the periodic testing page
    router.push('/periodic-testing');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <VStack align="stretch" gap={6}>
      {/* Header */}
      <HStack justify="space-between">
        <HStack>
          <PageTitle>Add Test Results</PageTitle>
        </HStack>
        <HStack>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft />
            Back
          </Button>
          <Button onClick={handleSubmit}>
            <Save /> Save
          </Button>
        </HStack>
      </HStack>

      {/* Form Content */}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={8}
        templateColumns={{ lg: '2fr 8fr' }}
      >
        {/* Left Sidebar - Configuration */}
        <VStack align="stretch" gap={6}>
          <Card.Root p={4}>
            <VStack align="stretch" gap={4}>
              {/* Test Date Selection */}
              <Field label="Test Date" required>
                <Input
                  type="date"
                  max={today}
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
              </Field>

              <Select.Root
                collection={testTypesCollection}
                multiple
                value={selectedTestTypes}
                onValueChange={({ value }) => handleTestTypeSelection(value)}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Choose test types" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {testTypesCollection.items.map((item) => (
                        <Select.Item item={item.value} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              {selectedTestTypes.length > 0 && (
                <Text fontSize="sm" color="gray.600">
                  {selectedTestTypes.length} test type(s) selected
                </Text>
              )}

              {/* Players Selection */}
              <Select.Root
                collection={playersCollection}
                multiple
                value={selectedPlayers}
                onValueChange={({ value }) => handlePlayerSelection(value)}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Choose players" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {playersCollection.items.map((item) => (
                        <Select.Item item={item.value} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              {selectedPlayers.length > 0 && (
                <Text fontSize="sm" color="gray.600">
                  {selectedPlayers.length} player(s) selected
                </Text>
              )}
            </VStack>
          </Card.Root>
        </VStack>

        {/* Right Content - Results Table */}
        <VStack align="stretch" gap={6}>
          {selectedTestTypes.length === 0 || selectedPlayers.length === 0 ? (
            <Card.Root p={8}>
              <VStack align="center" gap={4}>
                <Text fontSize="lg" color="gray.500">
                  Select test types and players to begin entering results
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Choose both test types and players from the sidebar to see the
                  results entry table.
                </Text>
              </VStack>
            </Card.Root>
          ) : (
            <Card.Root p={4}>
              <VStack align="stretch" gap={4}>
                <Box overflowX="auto">
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Player</Table.ColumnHeader>
                        {selectedTestTypes.map((testType) => (
                          <Table.ColumnHeader key={`${testType}-header`}>
                            {testType}
                          </Table.ColumnHeader>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {selectedPlayers.map((player) => (
                        <Table.Row key={player}>
                          <Table.Cell fontWeight="medium">{player}</Table.Cell>
                          {selectedTestTypes.map((testType) => (
                            <Table.Cell key={`${player}-${testType}-score`}>
                              <Input
                                variant="flushed"
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                size="sm"
                                value={playerResults[player]?.[testType] || ''}
                                onChange={(e) =>
                                  handleResultInput(
                                    player,
                                    testType,
                                    'score',
                                    e.target.value
                                  )
                                }
                              />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </VStack>
            </Card.Root>
          )}
        </VStack>
      </SimpleGrid>
    </VStack>
  );
}
