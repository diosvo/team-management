'use client';

import { useMemo } from 'react';

import {
  Combobox,
  HStack,
  Portal,
  Spinner,
  Text,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';

import { toaster } from '@/components/ui/toaster';

import { TestType } from '@/drizzle/schema';
import useQuery from '@/hooks/use-query';

import { getTestTypes } from '@/features/periodic-testing/actions/test-type';

interface TestTypesSelectionProps {
  selection: Array<TestType>;
  onSelectionChange: (selected: Array<TestType>) => void;
}

const MAX_VALUE_COUNT = 5 as const;

export default function TestTypesSelection({
  selection,
  onSelectionChange,
}: TestTypesSelectionProps) {
  const request = useQuery(async () => await getTestTypes());
  const { contains } = useFilter({ sensitivity: 'base' });

  const { collection, filter, reset } = useListCollection({
    initialItems: request.data || [],
    filter: contains,
    // https://chakra-ui.com/docs/components/combobox#custom-objects
    itemToString: (item) => item.name,
    itemToValue: (item) => item.type_id,
  });

  const selected = useMemo(
    () => selection.map(({ type_id }) => type_id),
    [selection]
  );

  return (
    <Combobox.Root
      required
      multiple
      openOnClick
      value={selected}
      collection={collection}
      onValueChange={(details) => {
        if (details.items.length > MAX_VALUE_COUNT) {
          toaster.warning({
            description: `You can only select up to ${MAX_VALUE_COUNT} types.`,
          });
          return;
        }
        onSelectionChange(details.items);
      }}
      onInputValueChange={(e) => filter(e.inputValue)}
    >
      <Combobox.Label display="flex">
        Select types
        <Text as="span" fontSize="xs" color="GrayText" marginLeft={2}>
          (max {MAX_VALUE_COUNT})
        </Text>
        <Text as="span" fontSize="xs" color="GrayText" marginLeft="auto">
          {selection.length} selected
        </Text>
      </Combobox.Label>

      <Combobox.Control>
        <Combobox.Input placeholder="Type to search" />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger onClick={reset} />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No types found</Combobox.Empty>
            {request.loading ? (
              <HStack padding={2}>
                <Spinner size="xs" borderWidth={1} />
                <Text>Loading...</Text>
              </HStack>
            ) : request.error ? (
              <Text padding={2} color="fg.error">
                {request.error.message}
              </Text>
            ) : (
              collection.items.map((item) => (
                <Combobox.Item item={item} key={item.type_id}>
                  <Combobox.ItemText truncate>
                    {item.name}{' '}
                    <Text as="span" fontSize="xs" color="GrayText">
                      ({item.unit})
                    </Text>
                  </Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
