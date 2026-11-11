'use client';

import { useTranslations } from 'next-intl';

import { ESTABLISHED_DATE } from '@/utils/constants';

import { usePerformanceFilters } from '@/lib/nuqs';

import { DateRangePicker } from '@/components/date-picker/DateRangePicker';

export default function PerformanceFilters() {
  const t = useTranslations('common');
  const [{ from, to }, setSearchParams] = usePerformanceFilters();

  return (
    <DateRangePicker
      label={t('time')}
      min={ESTABLISHED_DATE}
      value={{ from, to }}
      onChange={(range) =>
        // The only params the server reads, so they alone trigger a navigation.
        setSearchParams({ ...range, page: 1 }, { shallow: false })
      }
    />
  );
}
