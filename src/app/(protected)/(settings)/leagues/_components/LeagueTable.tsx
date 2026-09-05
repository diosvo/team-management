'use client';

import Link from 'next/link';
import { useMemo, useTransition } from 'react';

import { Badge, IconButton, VisuallyHidden } from '@chakra-ui/react';
import { isPast } from 'date-fns';
import { capitalize } from 'es-toolkit/string';
import { CircuitBoard } from 'lucide-react';

import Authorized from '@/components/Authorized';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { useLeagueFilters } from '@/lib/nuqs';
import { ACHIEVEMENT_STYLE } from '@/utils/constants/achievement';
import { AchievementType, LeagueStatus } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
import { formatDate } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { removeLeague } from '@/actions/league';
import type { League } from '@/drizzle/schema';

import { UpsertLeague } from './UpsertLeague';

type LeagueWithPlayerCount = League & {
  player_count: number;
  achievement_type: Array<AchievementType>;
};

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
      // Named for screen readers only: the column shows an icon, not a label.
      header: <VisuallyHidden>Achievement</VisuallyHidden>,
      headerProps: { width: '1px' },
      align: 'center',
      cell: (item) => {
        const [type] = item.achievement_type;

        if (!isPast(item.end_date) || !type) return null;

        const { icon: Icon, colorPalette, label } = ACHIEVEMENT_STYLE[type];

        return (
          <Authorized resource="achievements" action="create">
            <Tooltip content={label}>
              <IconButton
                asChild
                size="2xs"
                variant="ghost"
                colorPalette={colorPalette}
                aria-label="Record achievement"
                onClick={(event) => event.stopPropagation()}
              >
                <Link href={`/achievements?record=${item.league_id}`}>
                  <Icon role="img" aria-label={label} />
                </Link>
              </IconButton>
            </Tooltip>
          </Authorized>
        );
      },
    },
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
