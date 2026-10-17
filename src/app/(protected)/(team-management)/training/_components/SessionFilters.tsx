'use client';

import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import { useTrainingFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { useSelection } from '@/i18n/enums';
import { ESTABLISHED_DATE, SESSION_STATUS_SELECTION } from '@/utils/constants';

export default function SessionFilters() {
  const t = useTranslations('training.filters');
  const tc = useTranslations('common');
  const statusOptions = useSelection(SESSION_STATUS_SELECTION, 'sessionStatus');

  const FILTERS: Array<FilterDef> = [
    {
      key: 'range',
      label: t('time'),
      control: { type: 'date-range', min: ESTABLISHED_DATE },
    },
    {
      key: 'status',
      label: tc('status'),
      control: { type: 'checkbox-group', options: statusOptions },
    },
  ];

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
