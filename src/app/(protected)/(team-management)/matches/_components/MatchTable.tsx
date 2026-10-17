'use client';

import { useCallback } from 'react';

import { Badge, HStack, Span } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { LeagueLink } from '@/components/common/LeagueSelection';
import { LocationLink } from '@/components/common/LocationSelection';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { enumLabel } from '@/i18n/enums';
import { useMatchFilters } from '@/lib/nuqs';
import type { MatchWithTeams } from '@/types/match';
import { formatDate, formatDay } from '@/utils/datetime';
import { MatchStatus } from '@/utils/enum';
import { getColor } from '@/utils/helper';

import { removeMatch } from '@/actions/match';
import { UpsertMatch } from './UpsertMatch';

export default function MatchTable({
  matches,
}: {
  matches: Array<MatchWithTeams>;
}) {
  const t = useTranslations('matches.table');
  const tc = useTranslations('common');
  const te = useTranslations('enums');
  const locale = useLocale();
  const { can } = usePermissions();
  const [{ q, page }, setSearchParams] = useMatchFilters();

  const predicate = useCallback(
    (item: MatchWithTeams) =>
      item.away_team.name.toLowerCase().includes(q.toLowerCase()),
    [q],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(matches, predicate, page);

  const columns: Array<Column<MatchWithTeams>> = [
    {
      header: t('opponent'),
      cell: (item) => (
        <HighlightText query={q}>{item.away_team.name}</HighlightText>
      ),
    },
    {
      header: t('league'),
      cell: (item) => <LeagueLink name={item.league?.name} />,
    },
    {
      header: tc('status'),
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {enumLabel(te, 'matchStatus', item.status)}
        </Badge>
      ),
    },
    {
      header: t('score'),
      cell: (item) =>
        item.status === MatchStatus.COMPLETED
          ? `${item.home_team_score} - ${item.away_team_score}`
          : '-',
    },
    {
      header: t('result'),
      cell: (item) =>
        item.result ? (
          <Badge
            variant="surface"
            borderRadius="full"
            colorPalette={getColor(item.result)}
          >
            {enumLabel(te, 'matchResult', item.result)}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      header: t('location'),
      cell: (item) => <LocationLink name={item.location?.name} />,
    },
    {
      header: tc('date'),
      cell: (item) => (
        <HStack gap={1}>
          <Span fontSize="sm">{formatDay(item.date, undefined, locale)}</Span>
          <Span color="gray.400">&bull;</Span>
          <Span fontSize="sm">{formatDate(item.date)}</Span>
          <Span color="gray.400">&bull;</Span>
          <Span fontSize="sm">{item.time}</Span>
        </HStack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.match_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: t('empty') }}
        onRowClick={(item) =>
          UpsertMatch.open('update-match', {
            action: 'Update',
            item: { ...item, away_team: item.away_team.team_id },
          })
        }
        selection={{
          canSelect: can('matches', 'delete'),
          items,
          selection,
          setSelection,
          disabled: isPending,
          onDelete: () => removeSelected(removeMatch, 'match'),
        }}
      />
      <UpsertMatch.Viewport />
    </>
  );
}
