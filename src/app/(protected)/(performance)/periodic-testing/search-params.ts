import { useQueryStates } from 'nuqs';
import { createLoader, parseAsString } from 'nuqs/server';

import { commonParams } from '@/utils/filters';

// Type-safe URL state in Next.js with nuqs
// https://youtu.be/qpczQVJMG1Y?si=E0uegJx8J1dk6dZQ
const searchParams = {
  ...commonParams,
  date: parseAsString.withDefault(''),
};

// SSR Loader
export const loadPeriodicTestingFilters = createLoader(searchParams);

export const usePeriodicTestingFilters = () =>
  useQueryStates(searchParams, {
    shallow: false,
  });
