'use client';

import { useCallback, useTransition } from 'react';

import { Badge, HStack, Span, Table } from '@chakra-ui/react';

import Authorized from '@/components/Authorized';
import { LeagueLink } from '@/components/common/LeagueSelection';
import { LocationLink } from '@/components/common/LocationSelection';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import useTableState from '@/hooks/use-table-state';

import { useMatchFilters } from '@/lib/nuqs';
import { MatchWithTeams } from '@/types/match';
import { formatDate, formatDay } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeMatch } from '@/actions/match';
import { UpsertMatch } from './UpsertMatch';

const HEADERS = [
  'Opponent',
  'League',
  'Score',
  'Result',
  'Location',
  'Date',
] as const;

export default function MatchTable({
  matches,
}: {
  matches: Array<MatchWithTeams>;
}) {
  const [isPending, startTransition] = useTransition();
  const [{ q, page }, setSearchParams] = useMatchFilters();

  const predicate = useCallback(
    (item: MatchWithTeams) =>
      item.away_team.name.toLowerCase().includes(q.toLowerCase()),
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
  } = useTableState(matches, predicate, page, {
    headerCount: HEADERS.length,
  });

  const removeItems = async () => {
    const id = toaster.create({
      type: 'loading',
      title: 'Deleting matches...',
    });

    startTransition(async () => {
      const results = await Promise.all(selection.map(removeMatch));
      const hasErrors = results.some(({ success }) => !success);
      const successCount = results.filter(({ success }) => success).length;

      toaster.update(id, {
        type: hasErrors ? 'warning' : 'success',
        title: hasErrors
          ? `Deleted ${successCount} match(es), but some operations failed.`
          : `Successfully deleted ${successCount} match(es).`,
      });

      setSelection([]);
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
              <Authorized resource="matches" action="delete">
                <Table.ColumnHeader width={6}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    disabled={isPending}
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) => {
                      setSelection(
                        changes.checked
                          ? items.map(({ match_id }) => match_id)
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
                  key={item.match_id}
                  _hover={{ cursor: 'pointer' }}
                  onClick={() => {
                    UpsertMatch.open('update-match', {
                      action: 'Update',
                      item: {
                        ...item,
                        away_team: item.away_team.team_id,
                      },
                    });
                  }}
                >
                  <Authorized resource="matches" action="delete">
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        disabled={isPending}
                        checked={selection.includes(item.match_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.match_id]
                              : prev.filter((id) => id !== item.match_id),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <HighlightText query={q}>
                      {item.away_team.name}
                    </HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <LeagueLink name={item.league?.name} />
                  </Table.Cell>
                  <Table.Cell>
                    {item.home_team_score} - {item.away_team_score}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={getColor(item.result)}
                    >
                      {item.result}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <LocationLink name={item.location?.name} />
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1}>
                      <Span fontSize="sm">{formatDay(item.date)}</Span>
                      <Span color="gray.400">&bull;</Span>
                      <Span fontSize="sm">{formatDate(item.date)}</Span>
                      <Span color="gray.400">&bull;</Span>
                      <Span fontSize="sm">{item.time}</Span>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState title="No matches found" />
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
      <UpsertMatch.Viewport />
    </>
  );
}
