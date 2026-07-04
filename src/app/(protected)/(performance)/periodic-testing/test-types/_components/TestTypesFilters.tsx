'use client';

import Filters from '@/components/filters/Filters';

import { useTestTypeFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { TEST_TYPE_UNIT_SELECTION } from '@/utils/constant';

const FILTERS: Array<FilterDef> = [
  {
    key: 'unit',
    label: 'Unit',
    control: { type: 'checkbox-group', options: TEST_TYPE_UNIT_SELECTION },
  },
];

export default function TestTypesFilters() {
  const [values, setSearchParams] = useTestTypeFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useTestTypeFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
