'use client';

import { useCallback, useTransition } from 'react';

import { Badge, HStack, Span } from '@chakra-ui/react';

import { LeagueLink } from '@/components/common/LeagueSelection';
import { LocationLink } from '@/components/common/LocationSelection';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useMatchFilters } from '@/lib/nuqs';
import { MatchWithTeams } from '@/types/match';
import { formatDate, formatDay } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeMatch } from '@/actions/match';
import { UpsertMatch } from './UpsertMatch';

export default function MatchTable({
  matches,
}: {
  matches: Array<MatchWithTeams>;
}) {
  const { can } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [{ q, page }, setSearchParams] = useMatchFilters();

  const predicate = useCallback(
    (item: MatchWithTeams) =>
      item.away_team.name.toLowerCase().includes(q.toLowerCase()),
    [q],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(matches, predicate, page);

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
      header: 'Score',
      cell: (item) => `${item.home_team_score} - ${item.away_team_score}`,
    },
    {
      header: 'Result',
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.result)}
        >
          {item.result}
        </Badge>
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
          onDelete: removeItems,
        }}
      />
      <UpsertMatch.Viewport />
    </>
  );
}
