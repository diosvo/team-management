'use client';

import { useEffect, useMemo } from 'react';

import {
  Combobox,
  ComboboxValueChangeDetails,
  HStack,
  Portal,
  Span,
  Spinner,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';

import { toaster } from '@/components/ui/toaster';

import { UseQueryReturn } from '@/hooks/use-query';
import { capitalize } from '@/utils/formatter';

// Merge with Comboxbox Props later!
type SearchableSelectProps<T> = Selector<Array<T>> &
  Required<{
    label: string;
    request: UseQueryReturn<Array<T>>;
    // 🚨 https://chakra-ui.com/docs/components/combobox#custom-objects
    itemToString: (item: T) => string;
    itemToValue: (item: T) => string;
  }> &
  Partial<{
    required: boolean;
    invalid: boolean;
    maxItems: number;
    placeholder: string;
    multiple: boolean;
    disabled: boolean;
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
  selection,
  required = false,
  invalid = false,
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

  const handleValueChange = ({ items }: ComboboxValueChangeDetails<T>) => {
    if (maxItems && items.length > maxItems) {
      toaster.warning({
        title: `You can only select up to ${maxItems} items.`,
      });
      return;
    }
    onSelectionChange(items);
  };

  const handleInputChange = (details: Combobox.InputValueChangeDetails) => {
    filter(details.inputValue);
  };

  const selected = useMemo(() => selection.map(itemToValue), [selection]);
  const isOverLimit = maxItems ? selection.length > maxItems : false;

  return (
    <Combobox.Root
      required={required}
      multiple={multiple}
      openOnClick
      invalid={invalid || isOverLimit}
      value={selected}
      collection={collection}
      disabled={disabled}
      onValueChange={handleValueChange}
      onInputValueChange={handleInputChange}
    >
      <Combobox.Label display="flex">
        {showHelperText ? (
          <>
            Select {label}
            <Span
              fontSize="xs"
              marginLeft="auto"
              color={isOverLimit ? 'fg.error' : 'GrayText'}
            >
              {selection.length} / {maxItems} selected
            </Span>
          </>
        ) : (
          capitalize(label)
        )}
      </Combobox.Label>

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
