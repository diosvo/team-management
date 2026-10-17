'use client';

import { useMemo } from 'react';

import {
  Button,
  DatePicker as ChakraDatePicker,
  HStack,
  Portal,
  Span,
  Stack,
  parseDate,
  useDatePickerContext,
  type DateValue,
} from '@chakra-ui/react';

import type { DateBounds, DateRange } from '@/types/common';
import {
  formatDayHint,
  getPresets,
  isWithinBounds,
  parseLocaleDate,
  type DateSelection,
} from '@/utils/datetime';

/* --------------------------------- Helpers -------------------------------- */

/** ISO day (`yyyy-MM-dd`) to the machine's calendar day; `undefined` if malformed. */
export const parseIsoDay = (value?: string): DateValue | undefined => {
  try {
    return value ? (parseDate(value) as DateValue) : undefined;
  } catch {
    return undefined;
  }
};

/** Typed `30/08/2026` back into the machine's calendar day. */
export const parseDisplayString = (value: string): DateValue | undefined => {
  const parsed = parseLocaleDate(value);
  return parsed ? (parseDate(parsed) as DateValue) : undefined;
};

/**
 * The machine's value for a window: both ends for `range`, the day for
 * `single`. Malformed ends are dropped, so "nothing selected" beats crashing.
 */
export const toSelection = (
  { from, to }: DateRange,
  selection: DateSelection,
): Array<DateValue> => {
  const days = selection === 'range' ? [from, to] : [from];
  const parsed = days.map(parseIsoDay);
  return parsed.every(Boolean) ? (parsed as Array<DateValue>) : [];
};

export const isSameSelection = (a: Array<DateValue>, b: Array<DateValue>) =>
  a.length === b.length && a.every((day, index) => day.compare(b[index]) === 0);

/* -------------------------------- Calendar -------------------------------- */

type PresetButtonProps = {
  label: string;
  range: DateRange;
  selection: DateSelection;
};

/** One shortcut in the sidebar, highlighted while it is the selection. */
const PresetButton = ({ label, range, selection }: PresetButtonProps) => {
  const ctx = useDatePickerContext();
  const value = toSelection(range, selection);
  const active = isSameSelection(ctx.value, value);
  const hint =
    selection === 'range'
      ? `${formatDayHint(range.from)} – ${formatDayHint(range.to)}`
      : formatDayHint(range.from);

  return (
    <ChakraDatePicker.PresetTrigger value={value} asChild>
      <Button
        size="xs"
        variant="ghost"
        width="full"
        justifyContent="space-between"
        fontWeight="normal"
        gap={3}
        // The machine's own "<date> to <date>" label would hide this one.
        aria-label={label}
        aria-pressed={active}
        data-selected={active ? '' : undefined}
        _selected={{ layerStyle: 'fill.subtle' }}
      >
        <Span>{label}</Span>
        <Span color="fg.muted" fontVariantNumeric="tabular-nums">
          {hint}
        </Span>
      </Button>
    </ChakraDatePicker.PresetTrigger>
  );
};

type CalendarProps = DateBounds & {
  selection: DateSelection;
  /** Hide the shortcut sidebar (e.g. a birth date has no useful shortcut). */
  presets?: boolean;
};

/**
 * The popover shared by both pickers: preset sidebar (Today / Yesterday /
 * Tomorrow for a day, This / Last week / month / year for a range) beside the
 * three drill-down views.
 */
export const Calendar = ({
  selection,
  presets = true,
  min,
  max,
}: CalendarProps) => {
  const shortcuts = useMemo(
    () =>
      getPresets(selection).filter(({ range }) =>
        isWithinBounds(range, { min, max }),
      ),
    [selection, min, max],
  );

  return (
    <Portal>
      <ChakraDatePicker.Positioner>
        <ChakraDatePicker.Content width="fit-content" maxWidth="100dvw">
          <HStack alignItems="start" gap={3}>
            {presets && shortcuts.length > 0 && (
              <Stack
                gap={0}
                minWidth={selection === 'range' ? '56' : '44'}
                paddingEnd={3}
                borderEndWidth="1px"
              >
                {shortcuts.map((preset) => (
                  <PresetButton
                    key={preset.label}
                    selection={selection}
                    {...preset}
                  />
                ))}
              </Stack>
            )}
            <Stack gap={0} flex="1" minWidth={0}>
              <ChakraDatePicker.View view="day">
                <ChakraDatePicker.Header />
                <ChakraDatePicker.DayTable />
              </ChakraDatePicker.View>
              <ChakraDatePicker.View view="month">
                <ChakraDatePicker.Header />
                <ChakraDatePicker.MonthTable />
              </ChakraDatePicker.View>
              <ChakraDatePicker.View view="year">
                <ChakraDatePicker.Header />
                <ChakraDatePicker.YearTable />
              </ChakraDatePicker.View>
            </Stack>
          </HStack>
        </ChakraDatePicker.Content>
      </ChakraDatePicker.Positioner>
    </Portal>
  );
};
