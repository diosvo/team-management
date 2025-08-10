'use client';

import { useMemo } from 'react';

import { Portal, Select, createListCollection } from '@chakra-ui/react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Status } from '@/components/ui/status';

import { StateSelection as StateItems } from '@/utils/constant';
import { UserState } from '@/utils/enum';
import { colorState } from '@/utils/helper';

interface StateSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  contentRef?: React.RefObject<Nullable<HTMLDivElement>>;
  disabled?: boolean;
  error?: string;
}

export default function StateSelection<T extends FieldValues>({
  control,
  name,
  contentRef,
  disabled = false,
  error,
}: StateSelectProps<T>) {
  const states = useMemo(
    () =>
      createListCollection({
        items: StateItems,
      }),
    []
  );

  return (
    <Field required label="State" invalid={!!error} errorText={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select.Root
            name={field.name}
            value={field.value ? [field.value] : [UserState.UNKNOWN]}
            onValueChange={({ value }) => field.onChange(value[0])}
            onInteractOutside={() => field.onBlur()}
            collection={states}
            disabled={disabled}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="State" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal container={contentRef}>
              <Select.Positioner>
                <Select.Content>
                  {states.items.map((state) => (
                    <Select.Item item={state} key={state.value}>
                      <Status colorPalette={colorState(state.value)}>
                        {state.label}
                      </Status>
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
