'use client';

import { useMemo, type ReactNode } from 'react';

import {
  Button,
  DatePicker as ChakraDatePicker,
  type DatePickerRootProps,
  type DateValue,
  Span,
} from '@chakra-ui/react';
import { CalendarSearch } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';

import useSyncedState from '@/hooks/use-synced-state';

import type { DateRange } from '@/types/common';
import { LOCALE } from '@/utils/constants';
import {
  describeRange,
  formatCalendarDay,
  type DateSelection,
} from '@/utils/datetime';

import {
  Calendar,
  isSameSelection,
  parseIsoDay,
  toSelection,
} from './Calendar';

export type DateRangePickerProps = {
  value: DateRange;
  onChange: (value: DateRange) => void;
} & Partial<{
  /** `single` commits a one-day window (`from === to`). Defaults to `range`. */
  selection: DateSelection;
  min: string;
  max: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  width: DatePickerRootProps['width'];
  /** Leads the trigger text; defaults to a calendar icon. */
  icon: ReactNode;
  /** For an optional window: shows a clear button while one is set. */
  onClear: () => void;
}>;

/**
- The picker is a button-triggered filter for the URL query window using the `?from=&to=` parameters.
- The trigger always displays the currently committed date window, so the UI matches the actual URL state.
- A user selection is committed in one step through a single `onChange` callback.
- This includes:
  - picking a single day,
  - choosing both ends of a range,
  - selecting a preset date window.
- A partially selected range is not kept or committed if the picker closes before it is finished.
- The intent is to avoid showing stale or transient selection state that hasn’t been saved to the URL yet.
*/
export function DateRangePicker({
  value,
  onChange,
  selection = 'range',
  min,
  max,
  label,
  placeholder = 'All time',
  disabled,
  width = { base: 'full', sm: 'max-content' },
  icon = <CalendarSearch size={16} />,
  onClear,
}: DateRangePickerProps) {
  const committed = useMemo(
    () => toSelection(value, selection),
    [value.from, value.to, selection],
  );
  // Keep the first tap synced so a range isn't swallowed.
  const [selected, setSelected] = useSyncedState(committed);
  const size = selection === 'range' ? 2 : 1;

  const handleValueChange = (next: Array<DateValue>) => {
    setSelected(next);
    if (next.length === size && !isSameSelection(next, committed)) {
      onChange({ from: next[0].toString(), to: next[size - 1].toString() });
    }
  };

  const isSet = Boolean(value.from && value.to);
  const text = isSet ? describeRange(value, selection) : placeholder;
  const clearable = Boolean(onClear) && isSet;

  return (
    <ChakraDatePicker.Root
      // Closed pickers skip rendering the calendar (and recompute presets on open).
      lazyMount
      unmountOnExit
      selectionMode={selection}
      width={width}
      flexShrink={{ base: 1, sm: 0 }}
      minWidth={0}
      locale={LOCALE}
      size={{ base: 'sm', md: 'md' }}
      disabled={disabled}
      min={parseIsoDay(min)}
      max={parseIsoDay(max)}
      value={selected}
      format={formatCalendarDay}
      onValueChange={({ value }) => handleValueChange(value)}
      onOpenChange={({ open }) => {
        if (!open) setSelected(committed);
      }}
    >
      <ChakraDatePicker.Control>
        {/* `unstyled`: the trigger slot is a 24x24 icon button otherwise. */}
        <ChakraDatePicker.Trigger asChild unstyled>
          <Button
            variant="outline"
            fontWeight="normal"
            width="full"
            whiteSpace="nowrap"
            // Room for the overlaid clear button.
            paddingEnd={clearable ? '8' : undefined}
            aria-label={label ? `${label}: ${text}` : text}
          >
            {icon}
            <Span truncate>{text}</Span>
          </Button>
        </ChakraDatePicker.Trigger>
        {clearable && (
          // Overlaid on the trigger's end (a button can't nest in a button).
          <ChakraDatePicker.IndicatorGroup>
            <CloseButton
              size="2xs"
              disabled={disabled}
              aria-label={label ? `Clear ${label}` : 'Clear dates'}
              onClick={onClear}
            />
          </ChakraDatePicker.IndicatorGroup>
        )}
      </ChakraDatePicker.Control>
      <Calendar selection={selection} min={min} max={max} />
    </ChakraDatePicker.Root>
  );
}
