'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';

import { DOCUMENT_TYPE_SELECTION, ESTABLISHED_DATE } from '@/utils/constants';

import { useDocumentFilters } from '@/lib/nuqs';

import Filters from '@/components/filters/Filters';
import { useSelection } from '@/i18n/enums';
import type { FilterDef } from '@/types/filters';

export default function DocumentFilters() {
  const t = useTranslations('documents.filters');
  const typeOptions = useSelection(DOCUMENT_TYPE_SELECTION, 'documentType');
  const [values, setSearchParams] = useDocumentFilters();

  const filters: Array<FilterDef> = [
    {
      key: 'event_date',
      label: t('eventDate'),
      control: {
        type: 'date-range',
        min: ESTABLISHED_DATE,
        icon: (
          <>
            <CalendarDays size={12} />
            &nbsp;{t('eventDate')}:&nbsp;
          </>
        ),
      },
    },
    {
      key: 'type',
      label: t('type'),
      control: { type: 'checkbox-group', options: typeOptions },
    },
  ];

  return (
    <Filters
      filters={filters}
      values={values}
      defaults={useDocumentFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
