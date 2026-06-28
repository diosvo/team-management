'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button, Highlight, HStack, SimpleGrid } from '@chakra-ui/react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';

import StepIndicator from '@/components/StepIndicator';
import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';

import { createTestResult } from '@/actions/test-result';
import { InsertTestResult } from '@/drizzle/schema';

import { TestConfigurationSelection } from '@/types/periodic-testing';
import { DEFAULT_DATE_FORMAT } from '@/utils/constant';

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
  // Entered scores, keyed by `${player_id}-${type_id}`.
  const [results, setResults] = useState<Record<string, string>>({});

  // Derive the payload from the current selection + entered scores instead of
  // mirroring it into state via an effect.
  const tableData = useMemo<Array<InsertTestResult>>(() => {
    const { players, types, date } = selection;
    if (!players.length || !types.length) return [];

    return players.flatMap(({ id }) =>
      types.map(({ type_id }) => ({
        type_id,
        player_id: id,
        result: results[`${id}-${type_id}`] || '0',
        date,
      })),
    );
  }, [selection, results]);

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
      templateColumns={{ lg: '1fr 2fr' }}
    >
      <Card
        title={
          <HStack>
            <StepIndicator step={1} />
            Test Configuration
          </HStack>
        }
        description={
          <Highlight
            query="active"
            styles={{ px: '0.5', backgroundColor: 'green.100' }}
          >
            Only active players can be joined to the test.
          </Highlight>
        }
      >
        <TestResultConfiguration
          selection={selection}
          setSelection={setSelection}
        />
      </Card>
      <Card
        title={
          <HStack>
            <StepIndicator step={2} />
            Test Result
          </HStack>
        }
        action={
          <Button
            size="sm"
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
        }
      >
        <TestResultTable
          configuration={selection}
          setSelection={setSelection}
          results={results}
          setResults={setResults}
        />
      </Card>
    </SimpleGrid>
  );
}
