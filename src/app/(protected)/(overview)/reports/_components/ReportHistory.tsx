'use client';

import { useState } from 'react';

import { Badge, Button, HStack } from '@chakra-ui/react';
import { capitalize } from 'es-toolkit/string';
import { Download, FileClock } from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import PageTitle from '@/components/PageTitle';

import { INTERVAL_LABEL, reportDownloadUrl } from '@/utils/constants';
import { ReportStatus } from '@/utils/enum';
import { formatDatetime } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { ReportHistory as ReportHistoryRow } from '@/drizzle/schema';

const PAGE_SIZE = 10;

// Cells derive everything from the row, so the columns are a module constant.
const COLUMNS: Array<Column<ReportHistoryRow>> = [
    { header: 'Period', cell: (item) => item.period },
    {
      header: 'Time Duration',
      cell: (item) => INTERVAL_LABEL.get(item.interval) ?? item.interval,
    },
    {
      header: 'Status',
      cell: (item) => (
        // A failed run keeps its error on the row — surface it on hover.
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
          title={item.error ?? undefined}
        >
          {capitalize(item.status)}
          {item.attempts > 1 ? ` (${item.attempts} attempts)` : ''}
        </Badge>
      ),
    },
    {
      header: 'Delivery',
      cell: (item) =>
        item.delivery_status ? (
          <Badge
            variant="surface"
            borderRadius="full"
            colorPalette={getColor(item.delivery_status)}
          >
            {capitalize(item.delivery_status)}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      header: 'Trigger',
      cell: (item) => (
        <Badge variant="outline" borderRadius="full">
          {capitalize(item.trigger)}
        </Badge>
      ),
    },
    { header: 'Generated At', cell: (item) => formatDatetime(item.created_at) },
    {
      header: '',
      align: 'right',
      cell: (item) => {
        const available =
          item.status === ReportStatus.SUCCESS && !!item.pathname;

        return (
          <Button
            size="xs"
            variant="outline"
            disabled={!available}
            asChild={available}
          >
            {available ? (
              <a href={reportDownloadUrl(item.report_id)}>
                <Download /> Download
              </a>
            ) : (
              <HStack>
                <Download /> Download
              </HStack>
            )}
          </Button>
        );
      },
    },
];

export default function ReportHistory({
  history,
}: {
  history: Array<ReportHistoryRow>;
}) {
  const [page, setPage] = useState(1);

  const start = (page - 1) * PAGE_SIZE;
  const currentData = history.slice(start, start + PAGE_SIZE);

  return (
    <>
      <PageTitle title="Report History" />
      <DataTable
        columns={COLUMNS}
        rowId={(item) => item.report_id}
        currentData={currentData}
        totalCount={history.length}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={({ page }) => setPage(page)}
        empty={{
          title: 'No reports generated yet',
          description: 'Scheduled and manual runs will appear here.',
          icon: <FileClock />,
        }}
      />
    </>
  );
}
