import { parseAsString, useQueryStates } from 'nuqs';
import { type Options } from 'nuqs/server';

import { commonParams } from '@/utils/filters';

const searchParams = {
  ...commonParams,
  date: parseAsString,
};

export const usePeriodicTestingFilters = (options: Options = {}) =>
  useQueryStates(searchParams, options);
