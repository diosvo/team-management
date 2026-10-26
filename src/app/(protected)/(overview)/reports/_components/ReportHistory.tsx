'use client';

import { useMemo, useState } from 'react';

import { Badge, Button, HStack, VisuallyHidden } from '@chakra-ui/react';
import { Download, FileClock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import PageTitle from '@/components/PageTitle';

import { enumLabel } from '@/i18n/enums';
import { reportDownloadUrl } from '@/utils/constants';
import { ReportStatus } from '@/utils/enum';
import { formatDatetime } from '@/utils/datetime';
import { getColor } from '@/utils/helper';

import { ReportHistory as ReportHistoryRow } from '@/drizzle/schema';

const PAGE_SIZE = 10;

type Translator = ReturnType<typeof useTranslations<'reports.history'>>;
type CommonTranslator = ReturnType<typeof useTranslations<'common'>>;
type EnumTranslator = ReturnType<typeof useTranslations<'enums'>>;

// Cells derive everything from the row; only the labels depend on the locale.
const createColumns = (
  t: Translator,
  tCommon: CommonTranslator,
  tEnums: EnumTranslator,
): Array<Column<ReportHistoryRow>> => [
  { header: t('period'), cell: (item) => item.period },
  {
    header: t('timeDuration'),
    cell: (item) => enumLabel(tEnums, 'interval', item.interval),
  },
  {
    header: tCommon('status'),
    cell: (item) => (
      // A failed run keeps its error on the row — surface it on hover.
      <Badge
        variant="surface"
        borderRadius="full"
        colorPalette={getColor(item.status)}
        title={item.error ?? undefined}
      >
        {enumLabel(tEnums, 'reportStatus', item.status)}
        {item.attempts > 1 ? t('attempts', { count: item.attempts }) : ''}
      </Badge>
    ),
  },
  {
    header: t('delivery'),
    cell: (item) =>
      item.delivery_status ? (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.delivery_status)}
        >
          {enumLabel(tEnums, 'emailStatus', item.delivery_status)}
        </Badge>
      ) : (
        '-'
      ),
  },
  {
    header: t('trigger'),
    cell: (item) => (
      <Badge variant="outline" borderRadius="full">
        {enumLabel(tEnums, 'reportTrigger', item.trigger)}
      </Badge>
    ),
  },
  {
    header: t('generatedAt'),
    cell: (item) => formatDatetime(item.created_at),
  },
  {
    header: <VisuallyHidden>{t('download')}</VisuallyHidden>,
    align: 'right',
    cell: (item) => {
      const available = item.status === ReportStatus.SUCCESS && !!item.pathname;

      return (
        <Button
          size="xs"
          variant="outline"
          disabled={!available}
          asChild={available}
        >
          {available ? (
            <a href={reportDownloadUrl(item.report_id)}>
              <Download /> {t('download')}
            </a>
          ) : (
            <HStack>
              <Download /> {t('download')}
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
  const t = useTranslations('reports.history');
  const tCommon = useTranslations('common');
  const tEnums = useTranslations('enums');
  const columns = useMemo(
    () => createColumns(t, tCommon, tEnums),
    [t, tCommon, tEnums],
  );
  const [page, setPage] = useState(1);

  const start = (page - 1) * PAGE_SIZE;
  const currentData = history.slice(start, start + PAGE_SIZE);

  return (
    <>
      <PageTitle title={t('title')} />
      <DataTable
        columns={columns}
        rowId={(item) => item.report_id}
        currentData={currentData}
        totalCount={history.length}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={({ page }) => setPage(page)}
        empty={{
          title: t('emptyTitle'),
          description: t('emptyDescription'),
          icon: <FileClock />,
        }}
      />
    </>
  );
}
