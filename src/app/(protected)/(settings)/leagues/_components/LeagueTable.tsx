'use client';

import { useState } from 'react';

import { Badge, Highlight, Table } from '@chakra-ui/react';
import { CircuitBoard } from 'lucide-react';

import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import { LeagueStatus } from '@/utils/enum';
import { paginateData, useCommonParams } from '@/utils/filters';
import { formatDate } from '@/utils/formatter';
import { colorLeagueStatus } from '@/utils/helper';

import { removeLeague } from '@/actions/league';
import { League } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';

import { UpsertLeague } from './UpsertLeague';

export default function LeagueTable({ leagues }: { leagues: Array<League> }) {
  const { isAdmin, isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useCommonParams();

  const [selection, setSelection] = useState<Array<string>>([]);
  const selectionCount = selection.length;

  const totalCount = leagues.length;
  const currentData = paginateData(leagues, page);

  // Only Upcoming leagues can be selected
  const isUpcoming = ({ status }: League) => status === LeagueStatus.UPCOMING;
  const selectableItems = leagues.filter(isUpcoming);
  const selectableCount = selectableItems.length;

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < selectableCount;

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeLeague));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Deleted ${successCount} league(s), but some operations failed.`
        : `Successfully deleted ${successCount} league(s).`,
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
                    disabled={selectableCount === 0}
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
              </Visibility>
              {[
                'Name',
                'Location',
                'No. Players',
                'Start Date',
                'End Date',
                'Status',
              ].map((header) => (
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
                  <Visibility isVisible={isAdmin}>
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
                  </Visibility>
                  <Table.Cell>
                    <Highlight query={q} styles={{ backgroundColor: 'yellow' }}>
                      {item.name}
                    </Highlight>
                  </Table.Cell>
                  {/* <Table.Cell>{item.location}</Table.Cell>
                  <Table.Cell>{item.noPlayers}</Table.Cell> */}
                  <Table.Cell>A</Table.Cell>
                  <Table.Cell>12</Table.Cell>
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
                <Table.Cell colSpan={isAdmin ? 7 : 6}>
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
    </>
  );
}
