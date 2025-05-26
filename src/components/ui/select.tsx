import {
  Select as ChakraSelect,
  createListCollection,
  Portal,
  Span,
  Stack,
} from '@chakra-ui/react';

export type SelectionOption<T> = {
  label: string;
  value: T;
  description?: string;
};

export interface SelectProps<T>
  extends Omit<ChakraSelect.RootProps, 'collection'> {
  collection: Array<SelectionOption<T>>;
  label?: string;
  containerRef?: React.RefObject<Nullable<HTMLDivElement>>;
}

export const Select = <T,>(props: SelectProps<T>) => {
  const { collection, label, containerRef, ...rest } = props;
  const dataset = createListCollection({ items: collection });

  return (
    <ChakraSelect.Root {...rest} collection={dataset}>
      <ChakraSelect.HiddenSelect />
      {label && <ChakraSelect.Label>{label}</ChakraSelect.Label>}

      <ChakraSelect.Control>
        <ChakraSelect.Trigger>
          <ChakraSelect.ValueText placeholder="Select" />
        </ChakraSelect.Trigger>
        <ChakraSelect.IndicatorGroup>
          <ChakraSelect.Indicator />
          <ChakraSelect.ClearTrigger />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Control>

      <Portal container={containerRef}>
        <ChakraSelect.Positioner>
          <ChakraSelect.Content>
            {dataset.items.map((item) => (
              <ChakraSelect.Item item={item} key={String(item.value)}>
                <Stack gap="0">
                  <ChakraSelect.ItemText>{item.label}</ChakraSelect.ItemText>
                  {item.description && (
                    <Span color="fg.muted" textStyle="xs">
                      {item.description}
                    </Span>
                  )}
                </Stack>
                <ChakraSelect.ItemIndicator />
              </ChakraSelect.Item>
            ))}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </Portal>
    </ChakraSelect.Root>
  );
};
