'use client';

import { useMemo } from 'react';

import { Badge } from '@chakra-ui/react';
import type { ListEmail } from 'resend';

import DataTable, { type Column } from '@/components/DataTable';
import Filters from '@/components/filters/Filters';
import HighlightText from '@/components/HighlightText';

import useTableState from '@/hooks/use-table-state';
import { useEmailFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { EMAIL_STATUS_SELECTION } from '@/utils/constant';
import { buildPredicate } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

const FILTERS: Array<FilterDef> = [
  {
    key: 'status',
    label: 'Status',
    control: { type: 'checkbox-group', options: EMAIL_STATUS_SELECTION },
  },
];

export default function SentEmails({ emails }: { emails: Array<ListEmail> }) {
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
      header: 'To',
      cell: (item) => <HighlightText query={q}>{item.to}</HighlightText>,
    },
    {
      header: 'Subject',
      cell: (item) => <HighlightText query={q}>{item.subject}</HighlightText>,
    },
    {
      header: 'Status',
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.last_event)}
        >
          {item.last_event}
        </Badge>
      ),
    },
    { header: 'Created At', cell: (item) => formatDatetime(item.created_at) },
  ];

  return (
    <>
      <Filters
        filters={FILTERS}
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
        empty={{ title: 'No emails sent.' }}
      />
    </>
  );
}
