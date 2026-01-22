'use client';

import { useState } from 'react';

import { Badge, Highlight, Table } from '@chakra-ui/react';

import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';
import { MatchWithTeams } from '@/types/match';
import { LOCALE_DATE_FORMAT } from '@/utils/constant';
import { paginateData, useMatchFilters } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';
import { colorMatchResult } from '@/utils/helper';

import { removeMatch } from '@/actions/match';
import { UpsertMatch } from './UpsertMatch';

export default function MatchTable({
  matches,
}: {
  matches: Array<MatchWithTeams>;
}) {
  const { isAdmin, isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useMatchFilters();

  const [selection, setSelection] = useState<Array<string>>([]);
  const selectionCount = selection.length;

  const totalCount = matches.length;
  const currentData = paginateData(matches, page);

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeMatch));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'error' : 'success',
      title: `Successfully deleted ${successCount} match(es).`,
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
              <Visibility isVisible={isAdmin}>
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
                          ? matches.map(({ match_id }) => match_id)
                          : [],
                      );
                    }}
                  />
                </Table.ColumnHeader>
              </Visibility>
              {[
                'Opponent',
                'League',
                'Score',
                'Result',
                'Location',
                'Date',
              ].map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row
                  key={item.match_id}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    UpsertMatch.open('update-match', {
                      action: 'Update',
                      item: {
                        ...item,
                        away_team: item.away_team.team_id,
                      },
                    });
                  }}
                >
                  <Visibility isVisible={isAdmin}>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.match_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.match_id]
                              : selection.filter((id) => id !== item.match_id),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Visibility>
                  <Table.Cell>
                    <Highlight query={q} styles={{ backgroundColor: 'yellow' }}>
                      {item.away_team.name}
                    </Highlight>
                  </Table.Cell>
                  <Table.Cell>{item.league?.name || '-'}</Table.Cell>
                  <Table.Cell>
                    {item.home_team_score} - {item.away_team_score}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={colorMatchResult(item.result)}
                    >
                      {item.result}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.location?.name || '-'}</Table.Cell>
                  <Table.Cell>
                    {formatDatetime(
                      new Date(`${item.date}T${item.time}`),
                      `${LOCALE_DATE_FORMAT} - EEEE · h:mm a`,
                    )}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={isAdmin ? 7 : 6}>
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
    </>
  );
}
