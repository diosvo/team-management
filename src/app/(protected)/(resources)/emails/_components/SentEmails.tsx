'use client';

import { useMemo } from 'react';

import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { ListEmail } from 'resend';

import DataTable, { type Column } from '@/components/DataTable';
import Filters from '@/components/filters/Filters';
import HighlightText from '@/components/HighlightText';

import useTableState from '@/hooks/use-table-state';
import { enumLabel, useSelection } from '@/i18n/enums';
import { useEmailFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { EMAIL_STATUS_SELECTION } from '@/utils/constants';
import { formatDatetime } from '@/utils/datetime';
import { buildPredicate } from '@/utils/filters';
import { getColor } from '@/utils/helper';

export default function SentEmails({ emails }: { emails: Array<ListEmail> }) {
  const t = useTranslations('emails.table');
  const tCommon = useTranslations('common');
  const tEnums = useTranslations('enums');
  const statusOptions = useSelection(EMAIL_STATUS_SELECTION, 'emailStatus');

  const filters: Array<FilterDef> = [
    {
      key: 'status',
      label: tCommon('status'),
      control: { type: 'checkbox-group', options: statusOptions },
    },
  ];

  const [values, setSearchParams] = useEmailFilters();
  const { page, q, status } = values;

  const predicate = useMemo(
    () =>
      buildPredicate<ListEmail>({
        search: {
          query: q,
          fields: [
            (item) => (Array.isArray(item.to) ? item.to.join(', ') : item.to),
            'subject',
          ],
        },
        match: { last_event: status },
      }),
    [q, status],
  );
  const { currentData, totalCount } = useTableState(emails, predicate, page);

  const columns: Array<Column<ListEmail>> = [
    {
      header: t('to'),
      cell: (item) => <HighlightText query={q}>{item.to}</HighlightText>,
    },
    {
      header: t('subject'),
      cell: (item) => <HighlightText query={q}>{item.subject}</HighlightText>,
    },
    {
      header: t('status'),
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.last_event)}
        >
          {enumLabel(tEnums, 'emailStatus', item.last_event)}
        </Badge>
      ),
    },
    {
      header: t('createdAt'),
      cell: (item) => formatDatetime(item.created_at),
    },
  ];

  return (
    <>
      <Filters
        filters={filters}
        values={values}
        defaults={useEmailFilters.defaults}
        onApply={(next) => setSearchParams({ ...next, page: 1 })}
      />
      <DataTable
        columns={columns}
        rowId={(item) => item.id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: t('empty') }}
      />
    </>
  );
}
