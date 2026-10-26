'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { Badge, IconButton, VisuallyHidden } from '@chakra-ui/react';
import { isPast } from 'date-fns';
import { CircuitBoard } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { Tooltip } from '@/components/ui/tooltip';

import { enumLabel } from '@/i18n/enums';
import { useLeagueFilters } from '@/lib/nuqs';
import { ACHIEVEMENT_STYLE } from '@/utils/constants/achievement';
import { formatDate } from '@/utils/datetime';
import { AchievementType, LeagueStatus } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
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
  const t = useTranslations('leagues.table');
  const tEnums = useTranslations('enums');
  const { can, isGuest } = usePermissions();
  const [{ q, page, status }, setSearchParams] = useLeagueFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<LeagueWithPlayerCount>({
        search: { query: q, fields: ['name'] },
        match: { status },
      }),
    [q, status],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(leagues, predicate, page);

  const columns: Array<Column<LeagueWithPlayerCount>> = [
    {
      // Named for screen readers only: the column shows an icon, not a label.
      header: <VisuallyHidden>{t('achievement')}</VisuallyHidden>,
      headerProps: { width: '1px' },
      align: 'center',
      cell: (item) => {
        const [type] = item.achievement_type;

        if (!isPast(item.end_date) || !type) return null;

        const { icon: Icon, colorPalette } = ACHIEVEMENT_STYLE[type];
        const label = enumLabel(tEnums, 'achievementType', type);

        return (
          <Authorized resource="achievements" action="create">
            <Tooltip content={label}>
              <IconButton
                asChild
                size="2xs"
                variant="ghost"
                colorPalette={colorPalette}
                aria-label={t('recordAchievement')}
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
      header: t('name'),
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    { header: t('playerCount'), cell: (item) => item.player_count },
    { header: t('startDate'), cell: (item) => formatDate(item.start_date) },
    { header: t('endDate'), cell: (item) => formatDate(item.end_date) },
    {
      header: t('status'),
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {enumLabel(tEnums, 'leagueStatus', item.status)}
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
        empty={{ title: t('empty'), icon: <CircuitBoard /> }}
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
          onDelete: () => removeSelected(removeLeague, 'league'),
        }}
      />
      <UpsertLeague.Viewport />
    </>
  );
}
