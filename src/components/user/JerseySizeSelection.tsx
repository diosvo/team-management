'use client';

import { useMemo } from 'react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { createListCollection, Portal, Select } from '@chakra-ui/react';

import { JERSEY_SIZES } from '@/utils/enum';

import { Field } from '@/components/ui/field';

type Option = { label: string; value: string };

const SIZE_OPTIONS: Array<Option> = JERSEY_SIZES.map((size) => ({
  label: size,
  value: size,
}));

type JerseySizeSelectionProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  contentRef?: React.RefObject<Nullable<HTMLDivElement>>;
  // Defaults to the jersey sizes; pass others (e.g. the short type) to reuse it.
  options?: Array<Option>;
};

/**
 * Clearable single pick for a player's jersey details: shirt or short size by
 * default (universal labels, not translated), or any `options` given.
 */
export default function JerseySizeSelection<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
  contentRef,
  options = SIZE_OPTIONS,
}: JerseySizeSelectionProps<T>) {
  const sizes = useMemo(
    () => createListCollection({ items: options }),
    [options],
  );

  return (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select.Root
            collection={sizes}
            disabled={disabled}
            value={field.value ? [field.value] : []}
            onInteractOutside={() => field.onBlur()}
            onValueChange={({ value }) => field.onChange(value[0] ?? null)}
          >
            <Select.HiddenSelect />
            <Select.Label srOnly>{label}</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="-" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.ClearTrigger />
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal container={contentRef}>
              <Select.Positioner>
                <Select.Content>
                  {sizes.items.map((size) => (
                    <Select.Item item={size} key={size.value}>
                      {size.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        )}
      />
    </Field>
  );
}
