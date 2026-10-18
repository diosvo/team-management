'use client';

import { Span, VStack } from '@chakra-ui/react';

import DatePicker from '@/components/date-picker/DatePicker';
import SearchableSelect from '@/components/SearchableSelect';
import { Field } from '@/components/ui/field';
import { PlayerSelectionWithActions } from '@/components/user/PlayerSelection';

import type { TestConfigurationSelection } from '@/types/periodic-testing';
import { ESTABLISHED_DATE } from '@/utils/constants';

import { getTestTypes } from '@/actions/test-type';

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
  return (
    <VStack gap={4}>
      <PlayerSelectionWithActions
        selection={selection.players}
        onSelectionChange={(selected) =>
          setSelection((prev) => ({
            ...prev,
            players: selected,
          }))
        }
      />
      <SearchableSelect
        multiple={true}
        label="types"
        action={getTestTypes}
        maxItems={5}
        value={selection.types}
        fieldProps={{ required: true }}
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
        onChange={(selected) =>
          setSelection((prev) => ({
            ...prev,
            types: selected,
          }))
        }
      />
      <Field label="Test Date" required>
        <DatePicker
          min={ESTABLISHED_DATE}
          value={selection.date}
          onChange={(date) =>
            setSelection((prev) => ({
              ...prev,
              date,
            }))
          }
        />
      </Field>
    </VStack>
  );
}
