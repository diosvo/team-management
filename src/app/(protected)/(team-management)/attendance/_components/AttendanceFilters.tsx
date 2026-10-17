'use client';

import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import { useSelection } from '@/i18n/enums';
import { useAttendanceFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import {
  ATTENDANCE_STATUS_SELECTION,
  ESTABLISHED_DATE,
} from '@/utils/constants';

export default function AttendanceFilters() {
  const [values, setSearchParams] = useAttendanceFilters();
  const t = useTranslations('attendance.filters');
  const statusOptions = useSelection(
    ATTENDANCE_STATUS_SELECTION,
    'attendanceStatus',
  );

  const FILTERS: Array<FilterDef> = [
    {
      key: 'date',
      label: t('date'),
      control: {
        type: 'date-range',
        selection: 'single',
        min: ESTABLISHED_DATE,
      },
    },
    {
      key: 'status',
      label: t('status'),
      control: { type: 'checkbox-group', options: statusOptions },
    },
  ];

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useAttendanceFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
