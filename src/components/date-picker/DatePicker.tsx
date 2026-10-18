'use client';

import {
  DatePicker as ChakraDatePicker,
  useFieldContext,
  type DatePickerRootProps,
} from '@chakra-ui/react';
import { CalendarDays, X } from 'lucide-react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { LOCALE } from '@/utils/constants';
import { formatCalendarDay } from '@/utils/datetime';

import { Calendar, parseDisplayString, parseIsoDay } from './Calendar';

export type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
} & Partial<{
  min: string;
  max: string;
  name: string;
  label: string;
  width: DatePickerRootProps['width'];
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  /** Hide the shortcut sidebar (e.g. a birth date has no useful shortcut). */
  presets: boolean;
  onBlur: () => void;
  rootProps: Partial<DatePickerRootProps>;
}>;

/**
 * Calendar input for a form field, holding one ISO day.
 *
 * For a react-hook-form field, use {@link DatePickerField} instead.
 */
export default function DatePicker({
  value,
  onChange,
  min,
  max,
  name,
  label,
  width = 'full',
  // Left undefined so the machine falls back to the locale's own hint.
  placeholder,
  disabled,
  readOnly,
  invalid,
  presets = true,
  onBlur,
  rootProps,
}: DatePickerProps) {
  // `undefined` outside a `<Field>` - the context is registered non-strict.
  const field = useFieldContext() as
    ReturnType<typeof useFieldContext> | undefined;

  const day = parseIsoDay(value);

  return (
    <ChakraDatePicker.Root
      // Closed pickers skip rendering the calendar (and recompute presets on open).
      lazyMount
      unmountOnExit
      width={width}
      flexShrink={0}
      locale={LOCALE}
      size={{ base: 'sm', md: 'md' }}
      name={name}
      // The picker does not read the field context; point the label at us.
      ids={field ? { input: () => field.ids.control } : undefined}
      disabled={disabled ?? field?.disabled}
      readOnly={readOnly ?? field?.readOnly}
      invalid={invalid ?? field?.invalid}
      min={parseIsoDay(min)}
      max={parseIsoDay(max)}
      value={day ? [day] : []}
      format={formatCalendarDay}
      parse={parseDisplayString}
      // `valueAsString` is the display format; the ISO day lives on the value.
      onValueChange={({ value }) => onChange(value[0]?.toString() ?? '')}
      {...rootProps}
    >
      <ChakraDatePicker.Control>
        <ChakraDatePicker.Input
          aria-label={label}
          aria-describedby={field?.ariaDescribedby}
          aria-errormessage={field?.getInputProps()['aria-errormessage']}
          placeholder={placeholder}
          // Room for the absolutely positioned clear + calendar triggers.
          paddingEnd="14"
          onBlur={onBlur}
        />
        <ChakraDatePicker.IndicatorGroup>
          <ChakraDatePicker.ClearTrigger>
            <X size={14} />
          </ChakraDatePicker.ClearTrigger>
          <ChakraDatePicker.Trigger>
            <CalendarDays size={16} />
          </ChakraDatePicker.Trigger>
        </ChakraDatePicker.IndicatorGroup>
      </ChakraDatePicker.Control>
      <Calendar selection="single" presets={presets} min={min} max={max} />
    </ChakraDatePicker.Root>
  );
}

export type DatePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
> = Omit<DatePickerProps, 'value' | 'onChange' | 'name'> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

/** {@link DatePicker} bound to a react-hook-form field. */
export function DatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  disabled,
  ...rest
}: DatePickerFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DatePicker
          {...rest}
          name={field.name}
          value={(field.value as string) ?? ''}
          disabled={disabled ?? field.disabled}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
