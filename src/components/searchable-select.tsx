'use client';

import { useEffect, useMemo } from 'react';

import {
  Combobox,
  HStack,
  Portal,
  Span,
  Spinner,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';

import { toaster } from '@/components/ui/toaster';
import { UseQueryReturn } from '@/hooks/use-query';

interface SearchableSelectProps<T> {
  label: string;
  maxItems?: number;
  selection: Array<T>;
  request: UseQueryReturn<Array<T>>;
  onSelectionChange: (selected: Array<T>) => void;
  itemToString: (item: T) => string;
  itemToValue: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
}

export default function SearchableSelect<T>({
  label,
  maxItems,
  request,
  selection,
  onSelectionChange,
  itemToString,
  itemToValue,
  renderItem,
}: SearchableSelectProps<T>) {
  const { contains } = useFilter({ sensitivity: 'base' });

  const { collection, filter, set, reset } = useListCollection({
    initialItems: [],
    filter: contains,
    itemToString,
    itemToValue,
  });

  useEffect(() => {
    set(request.data || []);
  }, [request.data]);

  const max = useMemo(
    () => maxItems ?? collection.items.length,
    [maxItems, collection.items.length]
  );

  const selected = useMemo(
    () => selection.map(itemToValue),
    [selection, itemToValue]
  );

  const handleValueChange = (items: Array<T>) => {
    if (maxItems && items.length > maxItems) {
      toaster.warning({
        description: `You can only select up to ${maxItems} items.`,
      });
      return;
    }
    onSelectionChange(items);
  };

  const isOverLimit = maxItems ? selection.length > maxItems : false;

  return (
    <Combobox.Root
      multiple
      openOnClick
      value={selected}
      collection={collection}
      onInputValueChange={(e) => filter(e.inputValue)}
      onValueChange={({ items }) => handleValueChange(items)}
    >
      <Combobox.Label display="flex">
        Select {label}
        <Span fontSize="xs" color="GrayText" marginLeft={2}>
          (max {max})
        </Span>
        <Span
          fontSize="xs"
          color={isOverLimit ? 'fg.error' : 'GrayText'}
          marginLeft="auto"
        >
          {selection.length} / {max} selected
        </Span>
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
            <Combobox.Empty>No {label} found.</Combobox.Empty>
            {request.loading ? (
              <HStack padding={2}>
                <Spinner size="xs" borderWidth={1} />
                <Span>Loading...</Span>
              </HStack>
            ) : request.error ? (
              <Span padding={2} color="fg.error">
                {request.error.message}
              </Span>
            ) : (
              collection.items.map((item) => (
                <Combobox.Item item={item} key={itemToValue(item)}>
                  <Combobox.ItemText truncate>
                    {renderItem ? renderItem(item) : itemToString(item)}
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
