'use client';

import { useTranslations } from 'next-intl';
import { Badge, HStack, SimpleGrid, Span, VStack } from '@chakra-ui/react';
import { GamepadDirectional } from 'lucide-react';

import { MATCH_AVERAGE_FIELDS, MATCH_STAT_FIELDS } from '@/utils/constants';
import { formatDate } from '@/utils/datetime';
import { paginateData } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { usePerformanceFilters } from '@/lib/nuqs';

import DataTable, { type Column } from '@/components/DataTable';
import StatAbbr from '@/components/StatAbbr';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Stat } from '@/components/ui/stat';
import { enumLabel } from '@/i18n/enums';
import type {
  MatchesOverview,
  MatchPerformanceRecord,
} from '@/types/performance';

import { MatchStatsChart } from '../LazyCharts';

export default function MatchPerformance({ data }: { data: MatchesOverview }) {
  const t = useTranslations('performance.matches');
  const ts = useTranslations('matches.boxScore');
  const te = useTranslations('enums');
  const [{ page }, setSearchParams] = usePerformanceFilters();

  if (data.records.length === 0) {
    return (
      <Card title={t('title')}>
        <EmptyState
          icon={<GamepadDirectional />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      </Card>
    );
  }

  // Newest first in the table; the chart keeps chronological order.
  const records = [...data.records].reverse();
  const currentData = paginateData(records, page);

  const columns: Array<Column<MatchPerformanceRecord>> = [
    { header: t('columns.date'), cell: (item) => formatDate(item.date) },
    {
      header: t('columns.opponent'),
      cell: (item) => (
        <HStack>
          <Span>{item.opponent}</Span>
          <Badge
            size="xs"
            variant="surface"
            borderRadius="full"
            colorPalette={getColor(item.result)}
          >
            {enumLabel(te, 'matchResult', item.result)}
          </Badge>
        </HStack>
      ),
    },
    { header: t('columns.score'), cell: (item) => item.score },
    ...MATCH_STAT_FIELDS.map<Column<MatchPerformanceRecord>>(({ key }) => ({
      header: (
        <StatAbbr
          short={ts(`stats.${key}.short`)}
          label={ts(`stats.${key}.label`)}
        />
      ),
      align: 'center',
      cell: (item) => item[key],
    })),
  ];

  return (
    <VStack alignItems="stretch" gap={6}>
      <Card title={t('chartTitle')} description={t('chartDescription')}>
        <MatchStatsChart records={data.records} />

        <SimpleGrid
          columns={{ base: 2, md: 4, lg: MATCH_AVERAGE_FIELDS.length }}
          gap={{ base: 2, lg: 3 }}
          marginTop={4}
        >
          {MATCH_AVERAGE_FIELDS.map(({ key }) => (
            <Stat
              key={key}
              size="sm"
              label={t('average', {
                stat: ts(`stats.${key}.label`).toLowerCase(),
              })}
              value={data.averages[key]}
            />
          ))}
        </SimpleGrid>
      </Card>

      <Card title={t('boxScoresTitle')} description={t('boxScoresDescription')}>
        <DataTable
          columns={columns}
          rowId={(item) => item.match_id}
          currentData={currentData}
          totalCount={records.length}
          page={page}
          onPageChange={setSearchParams}
          empty={{ title: t('noBoxScores') }}
        />
      </Card>
    </VStack>
  );
}
