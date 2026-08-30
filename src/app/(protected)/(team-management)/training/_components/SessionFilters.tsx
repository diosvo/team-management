'use client';

import Filters from '@/components/filters/Filters';

import { useTrainingFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { ESTABLISHED_DATE, SESSION_STATUS_SELECTION } from '@/utils/constants';

const FILTERS: Array<FilterDef> = [
  {
    key: 'range',
    label: 'Time',
    control: { type: 'date-range', min: ESTABLISHED_DATE },
  },
  {
    key: 'status',
    label: 'Status',
    control: { type: 'checkbox-group', options: SESSION_STATUS_SELECTION },
  },
];

export default function SessionFilters() {
  const [values, setSearchParams] = useTrainingFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useTrainingFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
