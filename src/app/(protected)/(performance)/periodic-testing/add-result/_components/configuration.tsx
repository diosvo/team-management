'use client';

import { Input, Span, VStack } from '@chakra-ui/react';

import SearchableSelect from '@/components/searchable-select';
import { Field } from '@/components/ui/field';
import PlayerSelection from '@/components/user/player-selection';

import useQuery from '@/hooks/use-query';
import { ESTABLISHED_DATE } from '@/utils/constant';

import { getTestTypes } from '@/features/periodic-testing/actions/test-type';
import { TestConfigurationSelection } from '@/features/periodic-testing/schemas/models';

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
  const request = useQuery(async () => await getTestTypes());

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
      <SearchableSelect
        label="types"
        request={request}
        maxItems={5}
        selection={selection.types}
        itemToString={(item) => item.name}
        itemToValue={(item) => item.type_id}
        renderItem={(item) => (
          <>
            {item.name}{' '}
            <Span fontSize="xs" color="GrayText">
              ({item.unit})
            </Span>
          </>
        )}
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
