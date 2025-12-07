import { format } from 'date-fns';

import { LOCALE_DATE_FORMAT, LOCALE_DATETIME_FORMAT } from './constant';

export function formatDate(date: Nullish<Date | string>): string {
  if (!date) return '-';
  return format(date, LOCALE_DATE_FORMAT);
}

export function formatDatetime(datetime: Nullish<Date | string>): string {
  if (!datetime) return '-';
  return format(datetime, LOCALE_DATETIME_FORMAT);
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * @description Visualize and test loading states, skeletons, and suspense behavior by artificially introducing latency in data fetching
 */
export function mockDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
