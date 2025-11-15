import { format } from 'date-fns';

import { LOCALE_DATE_FORMAT, LOCALE_DATETIME_FORMAT } from './constant';

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';

  return format(date, LOCALE_DATE_FORMAT);
};

export const formatDatetime = (
  datetime: Date | string | null | undefined
): string => {
  if (!datetime) return '-';

  return format(datetime, LOCALE_DATETIME_FORMAT);
};

/**
 * @description Visualize and test loading states, skeletons, and suspense behavior by artificially introducing latency in data fetching
 */
export function mockDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
