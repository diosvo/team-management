'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, Card, Highlight, HStack, SimpleGrid } from '@chakra-ui/react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';

import StepIndicator from '@/components/step-indicator';
import { toaster } from '@/components/ui/toaster';

import { InsertTestResult } from '@/drizzle/schema';
import { DEFAULT_DATE_FORMAT } from '@/utils/constant';

import { createTestResult } from '@/actions/test-result';
import { TestConfigurationSelection } from '@/schemas/models';

import TestResultConfiguration from './TestResultConfiguration';
import TestResultTable from './TestResultTable';

export default function AddTestResultPageClient() {
  const router = useRouter();
  const [selection, setSelection] = useState<TestConfigurationSelection>({
    players: [],
    types: [],
    date: format(new Date(), DEFAULT_DATE_FORMAT),
  });

  const [isPending, startTransition] = useTransition();
  const [tableData, setTableData] = useState<Array<InsertTestResult>>([]);

  const onSave = (data: Array<InsertTestResult>) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Saving...',
    });

    startTransition(async () => {
      const { success, message: description } = await createTestResult(data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title: 'Results saved successfully',
        description,
      });

      if (success) {
        // Redirect to the periodic testing page with the selected date
        router.replace(`/periodic-testing?date=${selection.date}`);
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
          <TestResultTable
            configuration={selection}
            setSelection={setSelection}
            onChange={setTableData}
          />
        </Card.Body>
      </Card.Root>
    </SimpleGrid>
  );
}
