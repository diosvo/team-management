'use client';

import { useMemo } from 'react';
import { useSWRConfig } from 'swr';

import { Avatar, HStack, Skeleton, Text } from '@chakra-ui/react';
import { UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/lib/nuqs';
import { CACHE_KEY } from '@/utils/constants';
import { formatDatetime } from '@/utils/datetime';
import { buildPredicate } from '@/utils/filters';

import { removeTeam } from '@/actions/team';
import type { Team } from '@/drizzle/schema';

import { useTeamLogo } from '@/hooks/use-image';
import { UpsertTeam } from './UpsertTeam';

export default function TeamTable({ teams }: { teams: Array<Team> }) {
  const t = useTranslations('teams.table');
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
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(teams, predicate, page);

  const columns: Array<Column<Team>> = [
    {
      header: t('name'),
      cell: (item) => <TeamNameCell team={item} query={q} />,
    },
    {
      header: t('email'),
      cell: (item) =>
        item.email ? (
          <HighlightText query={q}>{item.email}</HighlightText>
        ) : (
          '-'
        ),
    },
    { header: t('established'), cell: (item) => item.establish_year },
    {
      header: t('lastUpdated'),
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
        empty={{ title: t('empty'), icon: <UsersRound /> }}
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
          disabled: isPending,
          onDelete: () =>
            removeSelected(removeTeam, 'team', () =>
              mutate(CACHE_KEY.OPPONENTS, undefined, { revalidate: true }),
            ),
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
