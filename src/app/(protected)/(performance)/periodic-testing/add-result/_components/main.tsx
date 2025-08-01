'use client';

import { useState, useTransition } from 'react';

import { Button, Card, Highlight, HStack, SimpleGrid } from '@chakra-ui/react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';

import StepIndicator from '@/components/step-indicator';
import { toaster } from '@/components/ui/toaster';

import { InsertTestResult, TestType, User } from '@/drizzle/schema';
import { DEFAULT_DATE_FORMAT } from '@/utils/constant';

import { createTestResult } from '@/features/periodic-testing/actions/test-result';

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
    date: format(new Date(), DEFAULT_DATE_FORMAT),
  });

  const [isPending, startTransition] = useTransition();
  const [tableData, setTableData] = useState<Array<InsertTestResult>>([]);

  const onSave = (data: Array<InsertTestResult>) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Saving...',
    });

    startTransition(async () => {
      const { error, message: description } = await createTestResult(data);

      toaster.update(id, {
        type: error ? 'error' : 'success',
        title: 'Results saved successfully',
        description,
      });

      if (!error) {
        // TODO: Back to the periodic testing page
        // With the newest result that was just created with the date
      }
    });
  };

  return (
    <SimpleGrid
      columns={{ base: 1, lg: 2 }}
      gap={6}
      templateColumns={{ lg: '3fr 7fr' }}
    >
      <Card.Root>
        <Card.Header>
          <Card.Title>
            <StepIndicator step={1} />
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
          <HStack justifyContent="space-between">
            <Card.Title>
              <StepIndicator step={2} />
              Test Result
            </Card.Title>
            <Button
              disabled={
                !selection.players.length ||
                !selection.types.length ||
                !tableData.length ||
                isPending
              }
              onClick={() => onSave(tableData)}
            >
              <Save />
              Save
            </Button>
          </HStack>
        </Card.Header>
        <Card.Body>
          <TestResultTable configuration={selection} onChange={setTableData} />
        </Card.Body>
      </Card.Root>
    </SimpleGrid>
  );
}
