'use client';

import { useEffect } from 'react';

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
import Visibility from './Visibility';

type SearchableSelectProps<T> = Selector<Array<T>> &
  Required<{
    request: UseQueryReturn<Array<T>>;
    itemToString: (item: T) => string;
    itemToValue: (item: T) => string;
  }> &
  Partial<{
    label: string;
    maxItems: number;
    placeholder: string;
    searchOnly: boolean;
    renderItem: (item: T) => React.ReactNode;
  }>;

export default function SearchableSelect<T>({
  label,
  request,
  maxItems,
  placeholder = 'Type to search',
  searchOnly = false,
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

  const handleValueChange = (items: Array<T>) => {
    if (maxItems && items.length > maxItems) {
      toaster.warning({
        description: `You can only select up to ${maxItems} items.`,
      });
      return;
    }
    onSelectionChange(items);
  };

  const selected = selection.map(itemToValue);
  const max = maxItems ?? collection.items.length;
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
      <Visibility isVisible={!searchOnly}>
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
      </Visibility>

      <Combobox.Control>
        <Combobox.Input placeholder={placeholder} />
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
