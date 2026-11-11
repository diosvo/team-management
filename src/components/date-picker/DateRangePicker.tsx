'use client';

import { type ReactNode, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Button,
  DatePicker as ChakraDatePicker,
  type DatePickerRootProps,
  type DateValue,
  Span,
} from '@chakra-ui/react';
import { CalendarSearch } from 'lucide-react';

import {
  type DateSelection,
  describeRange,
  findPreset,
  formatCalendarDay,
} from '@/utils/datetime';

import { CloseButton } from '@/components/ui/close-button';
import useSyncedState from '@/hooks/use-synced-state';
import { INTL_LOCALE } from '@/i18n/config';
import type { DateRange } from '@/types/common';

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
  placeholder,
  disabled,
  width = { base: 'full', sm: 'max-content' },
  icon = <CalendarSearch size={16} />,
  onClear,
}: DateRangePickerProps) {
  const t = useTranslations('components.datePicker');
  const locale = useLocale();
  const committed = useMemo(
    () => toSelection(value, selection),
    [value.from, value.to, selection],
  );
  // Keep the first tap synced so a range isn't swallowed.
  const [selected, setSelected] = useSyncedState(committed);
  const size = selection === 'range' ? 2 : 1;

  const handleValueChange = (next: Array<DateValue>) => {
    setSelected(next);
    const [from, to = from] = size === 2 ? next : [next[0]];
    if (
      next.length === size &&
      from &&
      to &&
      !isSameSelection(next, committed)
    ) {
      onChange({ from: from.toString(), to: to.toString() });
    }
  };

  const isSet = Boolean(value.from && value.to);
  const preset = isSet ? findPreset(value, selection) : undefined;
  const text = !isSet
    ? (placeholder ?? t('allTime'))
    : preset && t.has(`presets.${preset.id}` as never)
      ? t(`presets.${preset.id}` as never)
      : describeRange(value, selection);
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
      locale={INTL_LOCALE[locale]}
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
              aria-label={label ? t('clearLabel', { label }) : t('clearDates')}
              onClick={onClear}
            />
          </ChakraDatePicker.IndicatorGroup>
        )}
      </ChakraDatePicker.Control>
      <Calendar selection={selection} min={min} max={max} />
    </ChakraDatePicker.Root>
  );
}
