'use client';

import { useMemo, useTransition } from 'react';

import { Badge } from '@chakra-ui/react';
import { capitalize } from 'es-toolkit/string';
import { CircuitBoard } from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import { useLeagueFilters } from '@/lib/nuqs';
import { LeagueStatus } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
import { formatDate } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { removeLeague } from '@/actions/league';
import { League } from '@/drizzle/schema';

import { UpsertLeague } from './UpsertLeague';

type LeagueWithPlayerCount = League & { player_count: number };

export default function LeagueTable({
  leagues,
}: {
  leagues: Array<LeagueWithPlayerCount>;
}) {
  const { can, isGuest } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [{ q, page, status }, setSearchParams] = useLeagueFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<LeagueWithPlayerCount>({
        search: { query: q, fields: ['name'] },
        match: { status },
      }),
    [q, status],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(leagues, predicate, page);

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

      setSelection([]);
    });
  };

  const columns: Array<Column<LeagueWithPlayerCount>> = [
    {
      header: 'Name',
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    { header: 'No. Players', cell: (item) => item.player_count },
    { header: 'Start Date', cell: (item) => formatDate(item.start_date) },
    { header: 'End Date', cell: (item) => formatDate(item.end_date) },
    {
      header: 'Status',
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {capitalize(item.status)}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.league_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: 'No leagues found', icon: <CircuitBoard /> }}
        onRowClick={
          isGuest
            ? undefined
            : (item) =>
                UpsertLeague.open('update-league', { action: 'Update', item })
        }
        selection={{
          canSelect: can('leagues', 'delete'),
          items,
          selection,
          setSelection,
          // Only Upcoming leagues can be selected
          isSelectable: (item) => item.status === LeagueStatus.UPCOMING,
          disabled: isPending,
          onDelete: removeItems,
        }}
      />
      <UpsertLeague.Viewport />
    </>
  );
}
