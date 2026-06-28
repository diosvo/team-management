'use client';

import Filters from '@/components/filters/Filters';

import { useAttendanceFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import {
  ATTENDANCE_STATUS_SELECTION,
  ESTABLISHED_DATE,
} from '@/utils/constant';

const FILTERS: Array<FilterDef> = [
  {
    key: 'date',
    label: 'Date',
    control: { type: 'date', min: ESTABLISHED_DATE },
  },
  {
    key: 'status',
    label: 'Status',
    control: { type: 'checkbox-group', options: ATTENDANCE_STATUS_SELECTION },
  },
];

export default function AttendanceFilters() {
  const [values, setSearchParams] = useAttendanceFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useAttendanceFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
