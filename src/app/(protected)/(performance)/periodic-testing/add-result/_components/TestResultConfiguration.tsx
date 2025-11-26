'use client';

import { Input, Span, VStack } from '@chakra-ui/react';

import SearchableSelect from '@/components/SearchableSelect';
import { Field } from '@/components/ui/field';
import PlayerSelection from '@/components/user/PlayerSelection';

import { TestConfigurationSelection } from '@/types/periodic-testing';
import { ESTABLISHED_DATE } from '@/utils/constant';

import { getTestTypes } from '@/actions/test-type';
import useQuery from '@/hooks/use-query';

type TestResultConfigurationProps = {
  selection: TestConfigurationSelection;
  setSelection: React.Dispatch<
    React.SetStateAction<TestConfigurationSelection>
  >;
};

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
        itemToString={({ name }) => name}
        itemToValue={({ type_id }) => type_id}
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
