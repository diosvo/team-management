'use client';

import { Badge, Table } from '@chakra-ui/react';
import { useCallback } from 'react';
import type { ListEmail } from 'resend';

import Filters from '@/components/filters/Filters';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import { EmptyState } from '@/components/ui/empty-state';

import useTableState from '@/hooks/use-table-state';
import { useEmailFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { EMAIL_STATUS_SELECTION } from '@/utils/constant';
import { formatDatetime } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

const HEADERS = ['To', 'Subject', 'Status', 'Created At'] as const;

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

  const predicate = useCallback(
    (item: ListEmail) => {
      const matchesQuery =
        item.to.includes(q) ||
        item.subject.toLowerCase().includes(q.toLowerCase());
      const matchesStatus =
        status.length === 0 ||
        (status as Array<string>).includes(item.last_event);
      return matchesQuery && matchesStatus;
    },
    [q, status],
  );

  const { currentData, totalCount, columnCount } = useTableState(
    emails,
    predicate,
    page,
    {
      headerCount: HEADERS.length,
    },
  );

  return (
    <>
      <Filters
        filters={FILTERS}
        values={values}
        defaults={useEmailFilters.defaults}
        onApply={(next) => setSearchParams({ ...next, page: 1 })}
      />
      <Table.ScrollArea>
        <Table.Root borderWidth={1} size={{ base: 'sm', md: 'md' }}>
          <Table.Header>
            <Table.Row>
              {HEADERS.map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <HighlightText query={q}>{item.to}</HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <HighlightText query={q}>{item.subject}</HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={getColor(item.last_event)}
                    >
                      {item.last_event}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{formatDatetime(item.created_at)}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState title="No emails sent." />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={totalCount}
        page={page}
        onPageChange={setSearchParams}
      />
    </>
  );
}
