'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import {
  Badge,
  Link as ChakraLink,
  HStack,
  Span,
  Table,
} from '@chakra-ui/react';
import { CirclePile } from 'lucide-react';

import Authorized from '@/components/Authorized';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import { TrainingSessionWithDetails } from '@/types/training-session';

import { paginateData, useTrainingFilters } from '@/utils/filters';
import { formatDate, formatDay } from '@/utils/formatter';
import { colorSessionStatus } from '@/utils/helper';

import { removeSession } from '@/actions/training-session';
import { UpsertSession } from './UpsertSession';

const headers = ['Date', 'Time', 'Location', 'Status', 'Present Rate'] as const;

export default function SessionTable({
  sessions,
}: {
  sessions: Array<TrainingSessionWithDetails>;
}) {
  const { isGuest } = usePermissions();
  const [{ page }, setSearchParams] = useTrainingFilters();

  const [selection, setSelection] = useState<Array<string>>([]);
  const selectionCount = selection.length;

  const totalCount = sessions.length;
  const currentData = paginateData(sessions, page);

  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeSession));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'error' : 'success',
      title: `Successfully deleted ${successCount} session(s).`,
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
                          ? sessions.map(({ session_id }) => session_id)
                          : [],
                      );
                    }}
                  />
                </Table.ColumnHeader>
              </Authorized>
              {headers.map((header) => (
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
                  onClick={(e) => {
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
                              : selection.filter(
                                  (id) => id !== item.session_id,
                                ),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <ChakraLink variant="underline" colorPalette="blue" asChild>
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
                    {item.location?.name ? (
                      <ChakraLink
                        variant="underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          item.location.name,
                        )}`}
                        target="_blank"
                        colorPalette="pink"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.location.name}
                      </ChakraLink>
                    ) : (
                      '-'
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={colorSessionStatus(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.present_rate}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={headers.length + 1}>
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
    </>
  );
}
