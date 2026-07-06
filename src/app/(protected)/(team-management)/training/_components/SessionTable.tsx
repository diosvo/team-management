'use client';

import NextLink from 'next/link';
import { useCallback } from 'react';

import {
  Badge,
  Link as ChakraLink,
  HStack,
  List,
  Span,
} from '@chakra-ui/react';
import { CirclePile } from 'lucide-react';

import { LocationLink } from '@/components/common/LocationSelection';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { TrainingSessionWithDetails } from '@/types/training-session';

import { useTrainingFilters } from '@/lib/nuqs';
import { formatDate, formatDay } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeSession } from '@/actions/training-session';
import { UpsertSession } from './UpsertSession';

export default function SessionTable({
  sessions,
}: {
  sessions: Array<TrainingSessionWithDetails>;
}) {
  const { can, isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useTrainingFilters();

  const predicate = useCallback(
    (item: TrainingSessionWithDetails) =>
      (item.location?.name ?? '').toLowerCase().includes(q.toLowerCase()),
    [q],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(sessions, predicate, page);

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeSession));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Deleted ${successCount} session(s), but some operations failed.`
        : `Successfully deleted ${successCount} session(s).`,
    });

    setSelection([]);
  };

  const columns: Array<Column<TrainingSessionWithDetails>> = [
    {
      header: 'Date',
      cell: (item) => (
        <ChakraLink colorPalette="blue" asChild>
          <NextLink
            href={{ pathname: '/attendance', query: { date: item.date } }}
            onClick={(e) => e.stopPropagation()}
          >
            <HStack>
              <Span>{formatDay(item.date)}</Span>
              <Span color="gray.400">&bull;</Span>
              <Span>{formatDate(item.date)}</Span>
            </HStack>
          </NextLink>
        </ChakraLink>
      ),
    },
    {
      header: 'Time',
      cell: (item) => (
        <HStack gap={1}>
          <Span>{item.start_time}</Span>
          <Span color="gray.400">&rarr;</Span>
          <Span>{item.end_time}</Span>
        </HStack>
      ),
    },
    {
      header: 'Location',
      cell: (item) => (
        <LocationLink name={item.location?.name}>
          <HighlightText query={q}>{item.location?.name ?? '-'}</HighlightText>
        </LocationLink>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {item.status}
        </Badge>
      ),
    },
    {
      header: 'Present Rate',
      cell: (item) => (
        <Tooltip
          content={
            <List.Root paddingInline={4}>
              <List.Item>On Time: {item.analytics.on_time}</List.Item>
              <List.Item>Late: {item.analytics.late}</List.Item>
            </List.Root>
          }
          interactive
        >
          <Span>{item.analytics.present_rate}%</Span>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.session_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: 'No training sessions found', icon: <CirclePile /> }}
        onRowClick={
          isGuest
            ? undefined
            : (item) =>
                UpsertSession.open('update-session', { action: 'Update', item })
        }
        selection={{
          canSelect: can('training', 'delete'),
          items,
          selection,
          setSelection,
          onDelete: removeItems,
        }}
      />
      <UpsertSession.Viewport />
    </>
  );
}
