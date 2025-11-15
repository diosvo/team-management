'use client';

import {
  createListCollection,
  Portal,
  Select,
  SelectRootProps,
} from '@chakra-ui/react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Status } from '@/components/ui/status';

import { UserStateSelection } from '@/utils/constant';
import { UserState } from '@/utils/enum';
import { colorState } from '@/utils/helper';

type StateSelectionProps = Omit<SelectRootProps, 'collection'> &
  Partial<{
    placeholder: string;
    contentRef: React.RefObject<Nullable<HTMLDivElement>>;
  }>;

const states = createListCollection({
  items: UserStateSelection,
});

export function StateSelection({
  contentRef,
  placeholder = 'State',
  ...props
}: StateSelectionProps) {
  return (
    <Select.Root {...props} collection={states}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={placeholder} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          {props.multiple && <Select.ClearTrigger />}
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
  );
}

type StateSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  contentRef?: React.RefObject<Nullable<HTMLDivElement>>;
  disabled?: boolean;
  error?: string;
};

export function ControlledStateSelection<T extends FieldValues>({
  control,
  name,
  contentRef,
  disabled = false,
  error,
}: StateSelectProps<T>) {
  return (
    <Field required label="State" invalid={!!error} errorText={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <StateSelection
            defaultValue={[UserState.UNKNOWN]}
            disabled={disabled}
            contentRef={contentRef}
            onInteractOutside={() => field.onBlur()}
            onValueChange={({ value }) => field.onChange(value[0])}
          />
        )}
      />
    </Field>
  );
}
