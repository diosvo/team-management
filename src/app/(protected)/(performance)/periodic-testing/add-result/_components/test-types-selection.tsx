'use client';

import { useMemo } from 'react';

import {
  Combobox,
  Portal,
  Text,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';

import { TestType } from '@/drizzle/schema';

interface PlayerSelectionProps {
  max: number;
  data: Array<TestType>;
  selection: Array<TestType>;
  onSelectionChange: (selected: Array<TestType>) => void;
}

export default function TestTypesSelection({
  max,
  data,
  selection,
  onSelectionChange,
}: PlayerSelectionProps) {
  const { contains } = useFilter({ sensitivity: 'base' });

  const { collection, filter, reset } = useListCollection({
    initialItems: data,
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
      onValueChange={(details) => onSelectionChange(details.items)}
      onInputValueChange={(e) => filter(e.inputValue)}
    >
      <Combobox.Label>
        Select players
        <Text as="span" fontSize="xs" color="GrayText" marginLeft={2}>
          (max {max})
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
            <Combobox.Empty>No players found</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.type_id}>
                <Combobox.ItemText truncate>
                  {item.name} ({item.unit})
                </Combobox.ItemText>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
