'use client';

import Filters from '@/components/filters/Filters';

import { useTrainingFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { SESSION_STATUS_SELECTION } from '@/utils/constant';

const FILTERS: Array<FilterDef> = [
  { key: 'interval', label: 'Time', control: { type: 'interval' } },
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
