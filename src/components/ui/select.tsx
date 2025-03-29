'use client';

import {
  Select as ChakraSelect,
  createListCollection,
  Portal,
} from '@chakra-ui/react';

export interface SelectProps
  extends Omit<ChakraSelect.RootProps, 'collection'> {
  collection: Array<{ label: string; value: string }>;
}

export const Select = (props: SelectProps) => {
  const { collection, ...rest } = props;
  const dataset = createListCollection({ items: collection });

  return (
    <ChakraSelect.Root
      {...rest}
      collection={dataset}
      // onValueChange={({ value }) => field.onChange(value)}
      // onInteractOutside={() => field.onBlur()}
    >
      <ChakraSelect.HiddenSelect />
      <ChakraSelect.Label />

      <ChakraSelect.Control>
        <ChakraSelect.Trigger>
          <ChakraSelect.ValueText defaultValue="a" />
        </ChakraSelect.Trigger>
        <ChakraSelect.IndicatorGroup>
          <ChakraSelect.Indicator />
          <ChakraSelect.ClearTrigger />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Control>

      <Portal>
        <ChakraSelect.Positioner>
          <ChakraSelect.Content>
            {dataset.items.map((item) => (
              <ChakraSelect.Item item={item} key={item.value}>
                {item.label}
                <ChakraSelect.ItemIndicator />
              </ChakraSelect.Item>
            ))}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </Portal>
    </ChakraSelect.Root>
  );
};
