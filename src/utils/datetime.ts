import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

import type { DateBounds, DateRange } from '@/types/common';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_DAY_FORMAT,
  LOCALE_DATE_FORMAT,
  LOCALE_DATETIME_FORMAT,
  LOCALE_TIME_FORMAT,
} from './constants/app';
import { INTERVAL_LABEL } from './constants/interval';
import { Interval } from './enum';

/* -------------------------------------------------------------------------- */
/*                                 Formatting                                 */
/* -------------------------------------------------------------------------- */

export function formatDay(
  date: Nullish<Date | string>,
  dFormat = DEFAULT_DAY_FORMAT,
): string {
  if (!date) return '-';
  return format(date, dFormat);
}

export function formatDate(date: Nullish<Date | string>): string {
  if (!date) return '-';
  return format(date, LOCALE_DATE_FORMAT);
}

export function formatTime(
  date: Nullish<Date | string>,
  timeFormat = LOCALE_TIME_FORMAT,
): string {
  if (!date) return '-';
  return format(date, timeFormat);
}

export function formatDatetime(
  datetime: Nullish<Date | string>,
  dtFormat = LOCALE_DATETIME_FORMAT,
): string {
  if (!datetime) return '-';
  return format(datetime, dtFormat);
}

/** `01/01/2026 - 31/12/2026`, for report titles and filenames. */
export const formatDateRange = ({ from, to }: DateRange): string =>
  `${formatDate(from)} - ${formatDate(to)}`;

/** ISO day string (`yyyy-MM-dd`): what every date field and filter holds. */
export const toIsoDay = (date: Date): string =>
  format(date, DEFAULT_DATE_FORMAT);

/**
 * Inverse of {@link formatDate}: `30/08/2026` back to a `Date`, or `undefined`
 * while the text is half-typed or malformed.
 */
export const parseLocaleDate = (value: string): Date | undefined => {
  const parsed = parse(value, LOCALE_DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
};

/* -------------------------------------------------------------------------- */
/*                               Calendar days                                */
/* -------------------------------------------------------------------------- */

/** A bare calendar day, as the date picker's `DateValue` reports it. */
export type CalendarDay = { year: number; month: number; day: number };

// A calendar day has no time zone. Rebuilding it as a *local* Date keeps
// `format` off the UTC round-trip, which would shift the day west of GMT.
export const toLocalDate = ({ year, month, day }: CalendarDay): Date =>
  new Date(year, month - 1, day);

/** What the user sees and types in a picker: `30/08/2026`. */
export const formatCalendarDay = (day: CalendarDay): string =>
  formatDate(toLocalDate(day));

/** Compact hint beside a preset: `1 Aug`. `parseISO` keeps a bare day local. */
export const formatDayHint = (isoDay: string): string =>
  format(parseISO(isoDay), 'd MMM');

/* -------------------------------------------------------------------------- */
/*                                   Windows                                  */
/* -------------------------------------------------------------------------- */

const span = (from: Date, to: Date = from): DateRange => ({
  from: toIsoDay(from),
  to: toIsoDay(to),
});

// Monday-based, matching how the roster reads a training week.
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

/** One-day window, for pages that open on a single day (attendance). */
export const thisDay = (today: Date = new Date()): DateRange => span(today);

export const thisWeek = (today: Date = new Date()): DateRange =>
  span(startOfWeek(today, WEEK_OPTIONS), endOfWeek(today, WEEK_OPTIONS));

export const thisMonth = (today: Date = new Date()): DateRange =>
  span(startOfMonth(today), endOfMonth(today));

export const thisYear = (today: Date = new Date()): DateRange =>
  span(startOfYear(today), endOfYear(today));

/**
 * The window a scheduled report covers, resolved against `today` at call time
 * (never at module load, or a long-lived server would freeze "last month").
 */
export function intervalRange(
  interval: Interval,
  today: Date = new Date(),
): DateRange {
  switch (interval) {
    case Interval.THIS_MONTH:
      return thisMonth(today);
    case Interval.LAST_MONTH:
      return thisMonth(subMonths(today, 1));
    case Interval.THIS_YEAR:
      return thisYear(today);
    case Interval.LAST_YEAR:
      return thisYear(subYears(today, 1));
    default:
      throw new Error(`Invalid report interval: ${interval}`);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Presets                                  */
/* -------------------------------------------------------------------------- */

/**
 * How a picker selects: one day (`from === to`) or a two-ended window. Both
 * travel the same way, as `?from=&to=`.
 */
export type DateSelection = 'single' | 'range';

export interface DatePreset {
  label: string;
  range: DateRange;
}

const isSameRange = (a: DateRange, b: DateRange) =>
  a.from === b.from && a.to === b.to;

/** Shortcuts for a `single` picker. */
export const getDayPresets = (today: Date = new Date()): Array<DatePreset> => [
  { label: 'Today', range: thisDay(today) },
  { label: 'Yesterday', range: thisDay(subDays(today, 1)) },
  { label: 'Tomorrow', range: thisDay(addDays(today, 1)) },
];

/**
 * Shortcuts for a `range` picker.
 *
 * Deliberately *not* the picker's own built-in presets: those stop at today,
 * so "This year" would hide matches and sessions that are already scheduled.
 */
export const getPeriodPresets = (
  today: Date = new Date(),
): Array<DatePreset> => [
  { label: 'This week', range: thisWeek(today) },
  { label: 'Last week', range: thisWeek(subWeeks(today, 1)) },
  // The report windows, so the picker and the scheduler agree on each one.
  ...Object.values(Interval).map((interval) => ({
    label: INTERVAL_LABEL[interval],
    range: intervalRange(interval, today),
  })),
];

export const getPresets = (
  selection: DateSelection,
  today: Date = new Date(),
): Array<DatePreset> =>
  selection === 'single' ? getDayPresets(today) : getPeriodPresets(today);

/**
 * Whether a whole window lies inside the picker's bounds (inclusive ISO days,
 * which compare correctly as strings). Partial overlap is out: the machine
 * would clamp the pick, so the preset would not select what its label says.
 */
export const isWithinBounds = (
  { from, to }: DateRange,
  { min, max }: DateBounds,
): boolean => (!min || from >= min) && (!max || to <= max);

/**
 * What a picker's trigger shows for a committed window: the preset's name
 * when it is one (`Today`, `Last month`), otherwise the date(s) themselves.
 */
export function describeRange(
  range: DateRange,
  selection: DateSelection,
  today: Date = new Date(),
): string {
  const preset = getPresets(selection, today).find((candidate) =>
    isSameRange(candidate.range, range),
  );
  if (preset) return preset.label;
  return selection === 'single'
    ? formatDate(range.from)
    : formatDateRange(range);
}
