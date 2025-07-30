'use client';

import { Button, Card, Highlight, SimpleGrid } from '@chakra-ui/react';

import { TestType, User } from '@/drizzle/schema';
import { useState } from 'react';
import TestResultConfiguration from './configuration';
import TestResultTable from './table';

export default function AddTestResultPageClient({
  players,
  testTypes,
}: {
  players: Array<User>;
  testTypes: Array<TestType>;
}) {
  const [selection, setSelection] = useState({
    players: [] as Array<User>,
    types: [] as Array<TestType>,
  });

  // const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>([]);
  // const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  // const [testDate, setTestDate] = useState(
  //   new Date().toISOString().split('T')[0]
  // );
  // const [playerResults, setPlayerResults] = useState<
  //   Record<string, Record<string, string>>
  // >({});

  // // Get today's date for validation
  // const today = new Date().toISOString().split('T')[0];

  // // Create collections for Select components
  // const testTypesCollection = createListCollection({
  //   items: AVAILABLE_TEST_TYPES.map((type) => ({ value: type, label: type })),
  // });

  // const playersCollection = createListCollection({
  //   items: AVAILABLE_PLAYERS.map((player) => ({
  //     value: player,
  //     label: player,
  //   })),
  // });

  // // Handle test type selection
  // const handleTestTypeSelection = (values: string[]) => {
  //   if (values.length > 5) {
  //     toaster.create({
  //       type: 'warning',
  //       description: 'Maximum 5 test types can be selected at once',
  //     });
  //     return;
  //   }
  //   setSelectedTestTypes(values);
  // };

  // // Handle player selection
  // const handlePlayerSelection = (values: string[]) => {
  //   setSelectedPlayers(values);
  // };

  // // Handle score input
  // const handleResultInput = (
  //   playerName: string,
  //   testType: string,
  //   field: 'score',
  //   value: string
  // ) => {
  //   setPlayerResults((prev) => ({
  //     ...prev,
  //     [playerName]: {
  //       ...prev[playerName],
  //       [testType]: value,
  //     },
  //   }));
  // };

  // // Validate and submit results
  // const handleSubmit = () => {
  //   if (selectedTestTypes.length === 0) {
  //     toaster.create({
  //       type: 'error',
  //       description: 'Please select at least one test type',
  //     });
  //     return;
  //   }

  //   if (!testDate) {
  //     toaster.create({
  //       type: 'error',
  //       description: 'Please select a test date',
  //     });
  //     return;
  //   }

  //   if (selectedPlayers.length === 0) {
  //     toaster.create({
  //       type: 'error',
  //       description: 'Please select at least one player',
  //     });
  //     return;
  //   }

  //   const results: TestResult[] = [];
  //   let hasErrors = false;

  //   selectedPlayers.forEach((playerName) => {
  //     selectedTestTypes.forEach((testType) => {
  //       const playerData = playerResults[playerName]?.[testType];
  //       const score = playerData?.trim();

  //       if (!score) {
  //         hasErrors = true;
  //         return;
  //       }

  //       const numericScore = parseFloat(score);
  //       if (isNaN(numericScore)) {
  //         hasErrors = true;
  //         return;
  //       }

  //       results.push({
  //         player_name: playerName,
  //         test_type: testType,
  //         score: numericScore,
  //       });
  //     });
  //   });

  //   if (hasErrors) {
  //     toaster.create({
  //       type: 'error',
  //       description:
  //         'Please fill in valid scores for all selected test types and players',
  //     });
  //     return;
  //   }

  //   // Submit results to storage and redirect
  //   // addResults(results);

  //   toaster.create({
  //     type: 'success',
  //     description: `Successfully added ${results.length} test results`,
  //   });

  //   // Redirect back to the periodic testing page
  //   router.push('/periodic-testing');
  // };

  return (
    <SimpleGrid
      columns={{ base: 1, lg: 2 }}
      gap={6}
      templateColumns={{ lg: '3fr 7fr' }}
    >
      <Card.Root>
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
            Test Configuration
          </Card.Title>
          <Card.Description>
            <Highlight
              query="active"
              styles={{ px: '0.5', backgroundColor: 'green.100' }}
            >
              Only active players can be joined to the test.
            </Highlight>
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <TestResultConfiguration
            players={players}
            types={testTypes}
            selection={selection}
            setSelection={setSelection}
          />
        </Card.Body>
      </Card.Root>
      <Card.Root>
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
            Players' Results
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <TestResultTable selection={selection} />
        </Card.Body>
      </Card.Root>
    </SimpleGrid>
  );
}
