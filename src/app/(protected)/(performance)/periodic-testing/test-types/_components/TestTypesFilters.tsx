'use client';

import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import { useSelection } from '@/i18n/enums';
import { useTestTypeFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { TEST_TYPE_UNIT_SELECTION } from '@/utils/constants';

export default function TestTypesFilters() {
  const t = useTranslations('periodicTesting.testTypes');
  const unitOptions = useSelection(TEST_TYPE_UNIT_SELECTION, 'testTypeUnit');
  const filters: Array<FilterDef> = [
    {
      key: 'unit',
      label: t('unit'),
      control: { type: 'checkbox-group', options: unitOptions },
    },
  ];
  const [values, setSearchParams] = useTestTypeFilters();

  return (
    <Filters
      filters={filters}
      values={values}
      defaults={useTestTypeFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
