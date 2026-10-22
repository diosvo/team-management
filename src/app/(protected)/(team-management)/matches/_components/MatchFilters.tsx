'use client';

import Filters from '@/components/filters/Filters';

import type { FilterDef } from '@/types/filters';

import { useMatchFilters } from '@/lib/nuqs';
import {
  ESTABLISHED_DATE,
  GAME_TYPE_SELECTION,
  MATCH_STATUS_SELECTION,
  MATCH_TYPE_SELECTION,
} from '@/utils/constants';

const FILTERS: Array<FilterDef> = [
  {
    key: 'range',
    label: 'Time',
    control: { type: 'date-range', min: ESTABLISHED_DATE },
  },
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
  {
    key: 'status',
    label: 'Status',
    control: { type: 'checkbox-group', options: MATCH_STATUS_SELECTION },
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
