'use client';

import Filters from '@/components/filters/Filters';

import type { FilterDef } from '@/types/filters';

import { useMatchFilters } from '@/lib/nuqs';
import { GAME_TYPE_SELECTION, MATCH_TYPE_SELECTION } from '@/utils/constant';

const FILTERS: Array<FilterDef> = [
  { key: 'interval', label: 'Time', control: { type: 'interval' } },
  {
    key: 'game_type',
    label: 'Game Type',
    control: { type: 'checkbox-group', options: GAME_TYPE_SELECTION },
  },
  {
    key: 'match_type',
    label: 'Match Type',
    control: { type: 'checkbox-group', options: MATCH_TYPE_SELECTION },
  },
];

export default function MatchFilters() {
  const [values, setSearchParams] = useMatchFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useMatchFilters.defaults}
      onApply={(next) =>
        setSearchParams({ ...next, page: 1 }, { shallow: false })
      }
    />
  );
}
