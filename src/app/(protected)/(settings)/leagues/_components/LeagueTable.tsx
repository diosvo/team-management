'use client';

import { useCallback, useTransition } from 'react';

import { Badge, Table } from '@chakra-ui/react';
import { CircuitBoard } from 'lucide-react';

import Authorized from '@/components/Authorized';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import { ALL } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';
import { useLeagueFilters } from '@/utils/filters';
import { formatDate } from '@/utils/formatter';
import { colorLeagueStatus } from '@/utils/helper';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { removeLeague } from '@/actions/league';
import { League } from '@/drizzle/schema';

import { UpsertLeague } from './UpsertLeague';

const HEADERS = [
  'Name',
  'No. Players',
  'Start Date',
  'End Date',
  'Status',
] as const;

type LeagueWithPlayerCount = League & { player_count: number };

export default function LeagueTable({
  leagues,
}: {
  leagues: Array<LeagueWithPlayerCount>;
}) {
  const { isGuest } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [{ q, page, status }, setSearchParams] = useLeagueFilters();

  const predicate = useCallback(
    (item: LeagueWithPlayerCount) =>
      item.name.toLowerCase().includes(q.toLowerCase()) &&
      (status === ALL.value || item.status === status),
    [q, status],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    hasSelection,
    totalCount,
    columnCount,
    selectionCount,
  } = useTableState(leagues, predicate, page, {
    headerCount: HEADERS.length,
  });

  // Only Upcoming leagues can be selected
  const isUpcoming = ({ status }: League) => status === LeagueStatus.UPCOMING;
  const selectableItems = items.filter(isUpcoming);
  const selectableCount = selectableItems.length;
  const indeterminate = hasSelection && selectionCount < selectableCount;

  const removeItems = async () => {
    const id = toaster.create({
      type: 'loading',
      title: 'Deleting leagues...',
    });

    startTransition(async () => {
      const results = await Promise.all(
        selection.map((league_id) => removeLeague(league_id)),
      );
      const hasErrors = results.some(({ success }) => !success);
      const successCount = results.filter(({ success }) => success).length;

      toaster.update(id, {
        type: hasErrors ? 'warning' : 'success',
        title: hasErrors
          ? `Deleted ${successCount} league(s), but some operations failed.`
          : `Successfully deleted ${successCount} league(s).`,
      });

      if (!hasErrors) setSelection([]);
    });
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
              <Authorized resource="leagues" action="delete">
                <Table.ColumnHeader width={4}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    disabled={selectableCount === 0 || isPending}
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) => {
                      setSelection(
                        changes.checked
                          ? selectableItems.map(({ league_id }) => league_id)
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
                  key={item.league_id}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    UpsertLeague.open('update-league', {
                      action: 'Update',
                      item,
                    });
                  }}
                >
                  <Authorized resource="leagues" action="delete">
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        disabled={!isUpcoming(item)}
                        checked={selection.includes(item.league_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.league_id]
                              : prev.filter((id) => id !== item.league_id),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <HighlightText query={q}>{item.name}</HighlightText>
                  </Table.Cell>
                  <Table.Cell>{item.player_count}</Table.Cell>
                  <Table.Cell>{formatDate(item.start_date)}</Table.Cell>
                  <Table.Cell>{formatDate(item.end_date)}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={colorLeagueStatus(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState
                    title="No leagues found"
                    icon={<CircuitBoard />}
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
      <UpsertLeague.Viewport />
    </>
  );
}
