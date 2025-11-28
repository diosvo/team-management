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

import { LOCALE_DATE_FORMAT, LOCALE_DATETIME_FORMAT } from './constant';
import { Interval } from './enum';

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

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
