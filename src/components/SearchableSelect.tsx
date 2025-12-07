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
import Visibility from './Visibility';

import { UseQueryReturn } from '@/hooks/use-query';
import { capitalize } from '@/utils/formatter';

type SearchableSelectProps<T> = Selector<Array<T>> &
  Required<{
    label: string;
    request: UseQueryReturn<Array<T>>;
    itemToString: (item: T) => string;
    itemToValue: (item: T) => string;
  }> &
  Partial<{
    maxItems: number;
    placeholder: string;
    multiple: boolean;
    disabled: boolean;
    searchOnly: boolean;
    showHelperText: boolean;
    contentRef: React.RefObject<Nullable<HTMLDivElement>>;
    renderItem: (item: T) => React.ReactNode;
  }>;

export default function SearchableSelect<T>({
  multiple = true,
  label,
  request,
  maxItems,
  placeholder = 'Type to search',
  searchOnly = false,
  selection,
  disabled = false,
  showHelperText = true,
  contentRef,
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
        title: `You can only select up to ${maxItems} items.`,
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
      multiple={multiple}
      openOnClick
      value={selected}
      collection={collection}
      disabled={disabled}
      onInputValueChange={(e) => filter(e.inputValue)}
      onValueChange={({ items }) => handleValueChange(items)}
    >
      <Visibility isVisible={!searchOnly}>
        <Combobox.Label display="flex">
          {showHelperText ? (
            <>
              Select {label}
              <Span fontSize="xs" color="GrayText" marginLeft={2}>
                (max {max})
              </Span>
              <Span
                fontSize="xs"
                marginLeft="auto"
                color={isOverLimit ? 'fg.error' : 'GrayText'}
              >
                {selection.length} / {max} selected
              </Span>
            </>
          ) : (
            capitalize(label)
          )}
        </Combobox.Label>
      </Visibility>

      <Combobox.Control>
        <Combobox.Input placeholder={placeholder} />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger onClick={reset} />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <Portal container={contentRef}>
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
