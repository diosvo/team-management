'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Badge, HStack } from '@chakra-ui/react';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import useTableState from '@/hooks/use-table-state';

import { useProgressionFilters } from '@/lib/nuqs';
import type {
  PlayerProgression,
  TypeProgression,
} from '@/types/periodic-testing';
import { formatDate } from '@/utils/datetime';
import { buildPredicate } from '@/utils/filters';
import { formatResult } from '@/utils/progression';

import { BandBadge, ChangeText, StatusBadge } from './ProgressBadges';

export default function ProgressionTable({
  progression,
}: {
  progression: Nullable<TypeProgression>;
}) {
  const t = useTranslations('periodicTesting.progression');
  const router = useRouter();
  const [{ q, page, status, band }, setSearchParams] = useProgressionFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<PlayerProgression>({
        search: { query: q, fields: ['player_name'] },
        match: { status, band },
      }),
    [q, status, band],
  );
  const { currentData, totalCount } = useTableState(
    progression?.players ?? [],
    predicate,
    page,
  );

  const unit = progression?.type.unit;
  const columns: Array<Column<PlayerProgression>> = [
    {
      header: t('player'),
      cell: (item) => (
        <HighlightText query={q}>{item.player_name}</HighlightText>
      ),
    },
    {
      header: t('baseline'),
      cell: (item) => formatResult(item.baseline.result, unit),
    },
    {
      header: t('latest'),
      cell: (item) => formatResult(item.latest.result, unit),
    },
    {
      header: t('best'),
      cell: (item) => formatResult(item.best.result, unit),
    },
    {
      header: t('change'),
      cell: (item) => <ChangeText change={item.change} count={item.count} />,
    },
    {
      header: t('trend'),
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: t('target'),
      cell: (item) => <BandBadge band={item.band} />,
    },
    {
      header: t('lastTested'),
      cell: (item) => (
        <HStack>
          {formatDate(item.latest.date)}
          {item.missed_latest && (
            <Badge variant="subtle" colorPalette="orange" borderRadius="full">
              {t('missedLatest')}
            </Badge>
          )}
        </HStack>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rowId={(item) => item.player_id}
      currentData={currentData}
      totalCount={totalCount}
      page={page}
      onPageChange={setSearchParams}
      empty={{ title: t('empty'), icon: <TrendingUp /> }}
      onRowClick={(item) =>
        router.push(`/periodic-testing/progression/${item.player_id}`)
      }
    />
  );
}
