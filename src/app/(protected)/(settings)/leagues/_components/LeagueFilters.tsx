'use client';

import Filters from '@/components/filters/Filters';

import { useLeagueFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { LEAGUE_STATUS_SELECTION } from '@/utils/constants';

const FILTERS: Array<FilterDef> = [
  {
    key: 'status',
    label: 'Status',
    control: { type: 'checkbox-group', options: LEAGUE_STATUS_SELECTION },
  },
];

export default function LeagueFilters() {
  const [values, setSearchParams] = useLeagueFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useLeagueFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
