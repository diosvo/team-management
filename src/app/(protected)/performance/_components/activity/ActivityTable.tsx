'use client';

import { useCallback } from 'react';

import { Badge, HStack, SegmentGroup, Span, Text } from '@chakra-ui/react';
import {
  CalendarDays,
  Dumbbell,
  FlaskConical,
  GamepadDirectional,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';

import useTableState from '@/hooks/use-table-state';

import { enumLabel } from '@/i18n/enums';
import { usePerformanceFilters } from '@/lib/nuqs';
import type { ActivityRecord } from '@/types/performance';
import { ACTIVITY_KIND_SELECTION, ALL } from '@/utils/constants';
import { formatDate, formatDay } from '@/utils/datetime';
import { ActivityKind, TestTypeUnit } from '@/utils/enum';
import { getColor } from '@/utils/helper';

const PAGE_SIZE = 10;

const KIND_STYLE: Record<
  ActivityKind,
  { icon: LucideIcon; colorPalette: string }
> = {
  [ActivityKind.TRAINING]: { icon: Dumbbell, colorPalette: 'gray' },
  [ActivityKind.TEST]: { icon: FlaskConical, colorPalette: 'blue' },
  [ActivityKind.MATCH]: { icon: GamepadDirectional, colorPalette: 'purple' },
};

/** Symbol after a test result in the summary: `12.3s`, `85%`, `4.2m`. */
function unitSuffix(unit: string) {
  switch (unit) {
    case TestTypeUnit.PERCENT:
      return '%';
    case TestTypeUnit.SECONDS:
      return 's';
    case TestTypeUnit.METERS:
      return 'm';
    default:
      return '';
  }
}

export default function ActivityTable({
  records,
}: {
  records: Array<ActivityRecord>;
}) {
  const t = useTranslations('performance.activity');
  const te = useTranslations('enums');
  const locale = useLocale();
  const [{ kind, page }, setSearchParams] = usePerformanceFilters();

  const kindItems = [
    { label: te('all'), value: ALL.value },
    ...ACTIVITY_KIND_SELECTION.map(({ value }) => ({
      // Same colour as the kind's badge so the filter reads as a legend.
      label: (
        <Span color={`${KIND_STYLE[value].colorPalette}.fg`}>
          {t(`filters.${value}`)}
        </Span>
      ),
      value,
    })),
  ];

  const predicate = useCallback(
    (record: ActivityRecord) => kind.length === 0 || kind.includes(record.kind),
    [kind],
  );
  const { currentData, totalCount } = useTableState(records, predicate, page, {
    pageSize: PAGE_SIZE,
  });

  const details = (item: ActivityRecord) => {
    switch (item.kind) {
      case ActivityKind.TRAINING:
        return [
          item.location,
          item.duration_hours != null &&
            t('hours', { hours: item.duration_hours }),
        ]
          .filter(Boolean)
          .join(' · ');
      case ActivityKind.TEST:
        return t('testCount', { count: item.results.length });
      case ActivityKind.MATCH:
        return [
          t('versus', { opponent: item.opponent }),
          enumLabel(te, 'matchResult', item.result),
          item.score,
        ].join(' · ');
    }
  };

  const typeColumn: Column<ActivityRecord> = {
    header: t('columns.type'),
    cell: (item) => {
      const { icon: Icon, colorPalette } = KIND_STYLE[item.kind];
      return (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={colorPalette}
        >
          <Icon size={12} />
          {t(`kinds.${item.kind}`)}
        </Badge>
      );
    },
  };

  const columns: Array<Column<ActivityRecord>> = [
    {
      header: t('columns.date'),
      cell: (item) => (
        <HStack gap={1} whiteSpace="nowrap">
          <Span fontSize="sm">{formatDay(item.date, undefined, locale)}</Span>
          <Span color="gray.400">&bull;</Span>
          <Span fontSize="sm">{formatDate(item.date)}</Span>
        </HStack>
      ),
    },
    // A single-kind filter makes every badge the same, so only "All" shows it.
    ...(kind.length === 0 ? [typeColumn] : []),
    {
      header: t('columns.details'),
      cell: (item) => (
        <Text fontSize="sm" color="GrayText">
          {details(item)}
        </Text>
      ),
    },
    {
      header: t('columns.outcome'),
      align: 'right',
      cell: (item) => {
        if (item.kind === ActivityKind.TRAINING) {
          if (!item.status) {
            return (
              <Span fontSize="sm" color="GrayText">
                {t('notRecorded')}
              </Span>
            );
          }
          const badge = (
            <Badge
              variant="solid"
              borderRadius="full"
              colorPalette={getColor(item.status)}
            >
              {enumLabel(te, 'attendanceStatus', item.status)}
            </Badge>
          );
          return item.reason ? (
            <Tooltip content={item.reason}>{badge}</Tooltip>
          ) : (
            badge
          );
        }
        if (item.kind === ActivityKind.TEST) {
          // Keep test summaries narrow; show full text on hover.
          const text = item.results
            .map(
              ({ name, result, unit }) =>
                `${name} ${result}${unitSuffix(unit)}`,
            )
            .join(' · ');
          return (
            <Tooltip content={text}>
              <Text
                as="span"
                display="inline-block"
                fontSize="sm"
                maxWidth="2xs"
                truncate
              >
                {text}
              </Text>
            </Tooltip>
          );
        }
        return (
          <Text fontSize="sm" whiteSpace="nowrap">
            {t('matchLine', {
              points: item.points_scored,
              rebounds: item.rebounds,
              assists: item.assists,
            })}
          </Text>
        );
      },
    },
  ];

  return (
    <Card
      title={t('title')}
      description={t('description')}
      action={
        <SegmentGroup.Root
          size="sm"
          value={kind[0] ?? ALL.value}
          onValueChange={({ value }) =>
            setSearchParams({
              kind: value && value !== ALL.value ? [value as ActivityKind] : [],
              page: 1,
            })
          }
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items items={kindItems} />
        </SegmentGroup.Root>
      }
    >
      <DataTable
        columns={columns}
        rowId={(item) => item.id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setSearchParams}
        empty={{
          title: t('emptyTitle'),
          description: t('emptyDescription'),
          icon: <CalendarDays />,
        }}
      />
    </Card>
  );
}
