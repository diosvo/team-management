'use client';

import NextLink from 'next/link';
import { useCallback } from 'react';

import {
  Badge,
  Link as ChakraLink,
  HStack,
  List,
  Span,
  Table,
} from '@chakra-ui/react';
import { CirclePile } from 'lucide-react';

import Authorized from '@/components/Authorized';
import { LocationLink } from '@/components/common/LocationSelection';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { TrainingSessionWithDetails } from '@/types/training-session';

import { useTrainingFilters } from '@/lib/nuqs';
import { paginateData } from '@/utils/filters';
import { formatDate, formatDay } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeSession } from '@/actions/training-session';
import { UpsertSession } from './UpsertSession';

const HEADERS = ['Date', 'Time', 'Location', 'Status', 'Present Rate'] as const;

export default function SessionTable({
  sessions,
}: {
  sessions: Array<TrainingSessionWithDetails>;
}) {
  const { isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useTrainingFilters();

  const predicate = useCallback(
    (item: TrainingSessionWithDetails) =>
      (item.location?.name ?? '').toLowerCase().includes(q.toLowerCase()),
    [q],
  );
  const {
    items,
    currentData,
    indeterminate,
    selection,
    setSelection,
    hasSelection,
    totalCount,
    columnCount,
    selectionCount,
  } = useTableState(sessions, predicate, page, {
    headerCount: HEADERS.length,
  });

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

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={totalCount > 0}
        >
          <Table.Header>
            <Table.Row>
              <Authorized resource="training" action="delete">
                <Table.ColumnHeader width={6}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) => {
                      setSelection(
                        changes.checked
                          ? items.map(({ session_id }) => session_id)
                          : [],
                      );
                    }}
                  />
                </Table.ColumnHeader>
              </Authorized>
              {HEADERS.map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row
                  key={item.session_id}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    UpsertSession.open('update-session', {
                      action: 'Update',
                      item,
                    });
                  }}
                >
                  <Authorized resource="training" action="delete">
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.session_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.session_id]
                              : prev.filter((id) => id !== item.session_id),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <ChakraLink colorPalette="blue" asChild>
                      <NextLink
                        href={{
                          pathname: '/attendance',
                          query: { date: item.date },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HStack>
                          <Span>{formatDay(item.date)}</Span>
                          <Span color="gray.400">&bull;</Span>
                          <Span>{formatDate(item.date)}</Span>
                        </HStack>
                      </NextLink>
                    </ChakraLink>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1}>
                      <Span>{item.start_time}</Span>
                      <Span color="gray.400">&rarr;</Span>
                      <Span>{item.end_time}</Span>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <LocationLink name={item.location?.name}>
                      <HighlightText query={q}>
                        {item.location?.name ?? '-'}
                      </HighlightText>
                    </LocationLink>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={getColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </Table.Cell>
                  <Tooltip
                    content={
                      <List.Root paddingInline={4}>
                        <List.Item>On Time: {item.analytics.on_time}</List.Item>
                        <List.Item>Late: {item.analytics.late}</List.Item>
                      </List.Root>
                    }
                    interactive
                  >
                    <Table.Cell>{item.analytics.present_rate}%</Table.Cell>
                  </Tooltip>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState
                    title="No training sessions found"
                    icon={<CirclePile />}
                  />
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
      <SelectionActionBar
        open={hasSelection}
        selectionCount={selectionCount}
        onDelete={removeItems}
      />
      <UpsertSession.Viewport />
    </>
  );
}
