import {
  Select as ChakraSelect,
  createListCollection,
  Portal,
  Span,
  Stack,
} from '@chakra-ui/react';
import {
  Controller,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';

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

export interface SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T = any
> extends UseControllerProps<TFieldValues, TName>,
    Omit<SelectProps<T>, 'value' | 'defaultValue' | 'onValueChange'> {}

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

export const SelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T = any
>(
  props: SelectFieldProps<TFieldValues, TName, T>
) => {
  const {
    name,
    control,
    rules,
    shouldUnregister,
    defaultValue,
    ...selectProps
  } = props;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      render={({ field }) => (
        <Select
          {...selectProps}
          value={field.value ? [String(field.value)] : []}
          onValueChange={(details) => {
            field.onChange(details.value[0]);
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  );
};
