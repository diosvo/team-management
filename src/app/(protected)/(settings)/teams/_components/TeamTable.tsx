'use client';

import { useMemo } from 'react';
import { useSWRConfig } from 'swr';

import { Avatar, HStack, Skeleton, Text } from '@chakra-ui/react';
import { UsersRound } from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/lib/nuqs';
import { CACHE_KEY } from '@/utils/constant';
import { buildPredicate } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';

import { removeTeam } from '@/actions/team';
import { Team } from '@/drizzle/schema';

import { useTeamLogo } from '@/hooks/use-image';
import { UpsertTeam } from './UpsertTeam';

export default function TeamTable({ teams }: { teams: Array<Team> }) {
  const { mutate } = useSWRConfig();
  const { can } = usePermissions();
  const [{ q, page }, setSearchParams] = useCommonParams();

  const predicate = useMemo(
    () =>
      buildPredicate<Team>({
        search: { query: q, fields: ['name', 'email'] },
      }),
    [q],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(teams, predicate, page);

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeTeam));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;
    const errorMessages = results
      .filter(({ success }) => !success)
      .map(({ message }) => message)
      .join('\n ');

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `${successCount} deleted, some operations failed: ${errorMessages}`
        : `Successfully deleted ${successCount} team(s).`,
    });

    if (successCount > 0) {
      setSelection([]);
      mutate(CACHE_KEY.OPPONENTS, undefined, { revalidate: true });
    }
  };

  const columns: Array<Column<Team>> = [
    {
      header: 'Name',
      cell: (item) => <TeamNameCell team={item} query={q} />,
    },
    {
      header: 'Email',
      cell: (item) =>
        item.email ? (
          <HighlightText query={q}>{item.email}</HighlightText>
        ) : (
          '-'
        ),
    },
    { header: 'Established', cell: (item) => item.establish_year },
    {
      header: 'Last Updated',
      cell: (item) => formatDatetime(item.updated_at),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.team_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: 'No teams found', icon: <UsersRound /> }}
        onRowClick={
          can('teams', 'edit')
            ? (item) =>
                UpsertTeam.open('update-team', { action: 'Update', item })
            : undefined
        }
        selection={{
          canSelect: can('teams', 'delete'),
          items,
          selection,
          setSelection,
          onDelete: removeItems,
        }}
      />
      <UpsertTeam.Viewport />
    </>
  );
}

function TeamNameCell({ team, query }: { team: Team; query: string }) {
  const { data, isLoading } = useTeamLogo(team.image);

  return (
    <HStack>
      {isLoading ? (
        <Skeleton width={8} height={8} />
      ) : (
        <Avatar.Root shape="rounded" size="xs">
          <Avatar.Fallback name={team.name} />
          <Avatar.Image src={data ?? undefined} />
        </Avatar.Root>
      )}
      <Text marginLeft={2}>
        <HighlightText query={query}>{team.name}</HighlightText>
      </Text>
    </HStack>
  );
}
