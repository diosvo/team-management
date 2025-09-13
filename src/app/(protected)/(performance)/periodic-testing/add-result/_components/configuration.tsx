'use client';

import { Input, VStack } from '@chakra-ui/react';

import { Field } from '@/components/ui/field';
import PlayerSelection from '@/components/user/player-selection';

import { ESTABLISHED_DATE } from '@/utils/constant';

import { TestConfigurationSelection } from '@/features/periodic-testing/schemas/models';

import TestTypesSelection from './test-types-selection';

interface TestResultConfigurationProps {
  selection: TestConfigurationSelection;
  setSelection: React.Dispatch<
    React.SetStateAction<TestConfigurationSelection>
  >;
}

export default function TestResultConfiguration({
  selection,
  setSelection,
}: TestResultConfigurationProps) {
  return (
    <VStack gap={4}>
      <PlayerSelection
        selection={selection.players}
        onSelectionChange={(selected) =>
          setSelection((prev) => ({
            ...prev,
            players: selected,
          }))
        }
      />
      <TestTypesSelection
        selection={selection.types}
        onSelectionChange={(selected) =>
          setSelection((prev) => ({
            ...prev,
            types: selected,
          }))
        }
      />
      <Field label="Test Date" required>
        <Input
          type="date"
          min={ESTABLISHED_DATE}
          defaultValue={selection.date}
          onChange={(e) =>
            setSelection((prev) => ({
              ...prev,
              date: e.target.value,
            }))
          }
        />
      </Field>
    </VStack>
  );
}
