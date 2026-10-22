'use client';

import { useCallback } from 'react';

import { Badge, HStack, Span } from '@chakra-ui/react';

import { LeagueLink } from '@/components/common/LeagueSelection';
import { LocationLink } from '@/components/common/LocationSelection';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useMatchFilters } from '@/lib/nuqs';
import type { MatchWithTeams } from '@/types/match';
import { formatDate, formatDay } from '@/utils/datetime';
import { MatchStatus } from '@/utils/enum';
import { toLabel } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeMatch } from '@/actions/match';
import { UpsertMatch } from './UpsertMatch';

export default function MatchTable({
  matches,
}: {
  matches: Array<MatchWithTeams>;
}) {
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
      header: 'Opponent',
      cell: (item) => (
        <HighlightText query={q}>{item.away_team.name}</HighlightText>
      ),
    },
    {
      header: 'League',
      cell: (item) => <LeagueLink name={item.league?.name} />,
    },
    {
      header: 'Status',
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {toLabel(item.status)}
        </Badge>
      ),
    },
    {
      header: 'Score',
      cell: (item) =>
        item.status === MatchStatus.COMPLETED
          ? `${item.home_team_score} - ${item.away_team_score}`
          : '-',
    },
    {
      header: 'Result',
      cell: (item) =>
        item.result ? (
          <Badge
            variant="surface"
            borderRadius="full"
            colorPalette={getColor(item.result)}
          >
            {toLabel(item.result)}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      header: 'Location',
      cell: (item) => <LocationLink name={item.location?.name} />,
    },
    {
      header: 'Date',
      cell: (item) => (
        <HStack gap={1}>
          <Span fontSize="sm">{formatDay(item.date)}</Span>
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
        empty={{ title: 'No matches found' }}
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
