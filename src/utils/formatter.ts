import { TZDate } from '@date-fns/tz';
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns';

import {
  DEFAULT_DAY_FORMAT,
  LOCALE_DATE_FORMAT,
  LOCALE_DATETIME_FORMAT,
} from './constant';
import { Interval } from './enum';

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

export function formatDatetime(
  datetime: Nullish<Date | string>,
  dtFormat = LOCALE_DATETIME_FORMAT,
): string {
  if (!datetime) return '-';
  return format(datetime, dtFormat);
}

export function formatValueUnit(count: number, unit: string): Nullable<string> {
  // Symbols and multi-word phrases (e.g. "%", "days remaining") aren't count
  // nouns: show them verbatim. Simple words are hidden at 0 and pluralized,
  // unless they already end in "s" (e.g. "pts").
  if (!/^[a-z]+$/i.test(unit)) return unit;
  if (count === 0) return null;
  return count > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
}

// Replace CURRENT_DATE if possible
const currentDate = new TZDate(new Date(), 'UTC');
const lastMonth = subMonths(currentDate, 1);
const lastYear = subYears(currentDate, 1);

export const TIME_DURATION: Record<string, { start: Date; end: Date }> = {
  [Interval.LAST_MONTH]: {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  },
  [Interval.LAST_YEAR]: {
    start: startOfYear(lastYear),
    end: endOfYear(lastYear),
  },
  [Interval.THIS_MONTH]: {
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  },
  [Interval.THIS_YEAR]: {
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  },
};

export const formatDuration = (interval: string): string => {
  const period = TIME_DURATION[interval];

  if (!period) {
    throw new Error(`Invalid report interval: ${interval}`);
  }

  return `${formatDate(period.start)} - ${formatDate(period.end)}`;
};
