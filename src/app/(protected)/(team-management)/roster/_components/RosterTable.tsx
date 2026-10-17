'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Badge, Icon } from '@chakra-ui/react';
import { ShieldAlert, ShieldCheck, SwatchBook } from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { enumLabel } from '@/i18n/enums';
import { useRosterFilters } from '@/lib/nuqs';
import { UserRole } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { removeUser } from '@/actions/user';
import type { RosterUser } from '@/db/user';

const mask = (cc: string, num = 4) =>
  `${cc}`.slice(-num).padStart(`${cc}`.length, '*');

export default function RosterTable({ users }: { users: Array<RosterUser> }) {
  const router = useRouter();
  const t = useTranslations('roster.table');
  const tEnums = useTranslations('enums');
  const { isAdmin, isCaptain, isGuest } = usePermissions();
  const [{ q, page, state, role }, setSearchParams] = useRosterFilters();

  const canManage = isAdmin || isCaptain;

  const predicate = useMemo(
    () =>
      buildPredicate<RosterUser>({
        search: { query: q, fields: ['name', 'email'] },
        match: { state, role },
      }),
    [q, state, role],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(users, predicate, page);

  const columns: Array<Column<RosterUser>> = [
    ...(canManage
      ? [
          {
            header: t('verified'),
            align: 'center',
            cell: (user: RosterUser) =>
              user.emailVerified ? (
                <Icon as={ShieldCheck} size="sm" color="green.500" />
              ) : (
                <Icon as={ShieldAlert} size="sm" color="orange.500" />
              ),
          } satisfies Column<RosterUser>,
        ]
      : []),
    {
      header: t('jerseyNumber'),
      cell: (user) => user.player?.jersey_number ?? '-',
    },
    {
      header: t('name'),
      cell: (user) => (
        <HighlightText query={q}>
          {isGuest ? mask(user.name, -4) : user.name}
        </HighlightText>
      ),
    },
    {
      header: t('email'),
      cell: (user) => (
        <HighlightText query={q}>
          {isGuest ? mask(user.email, -4) : user.email}
        </HighlightText>
      ),
    },
    {
      header: t('state'),
      cell: (user) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(user.state)}
        >
          {enumLabel(tEnums, 'userState', user.state)}
        </Badge>
      ),
    },
    {
      header: t('roles'),
      cell: (user) => (
        <Badge variant="outline" borderRadius="full">
          {enumLabel(tEnums, 'userRole', user.role)}
        </Badge>
      ),
    },
    {
      header: t('position'),
      cell: (user) => {
        const position =
          user.role === UserRole.COACH
            ? user.coach?.position
            : user.role === UserRole.PLAYER
              ? user.player?.position
              : undefined;

        return position ? (
          <Badge variant="outline" borderRadius="full">
            {enumLabel(
              tEnums,
              user.role === UserRole.COACH ? 'coachPosition' : 'playerPosition',
              position,
            )}
          </Badge>
        ) : (
          '-'
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rowId={(user) => user.id}
      currentData={currentData}
      totalCount={totalCount}
      page={page}
      onPageChange={setSearchParams}
      empty={{ title: t('empty'), icon: <SwatchBook /> }}
      stickyHeader
      onRowClick={
        isGuest ? undefined : (user) => router.replace('/profile/' + user.id)
      }
      selection={{
        canSelect: canManage,
        items,
        selection,
        setSelection,
        disabled: isPending,
        onDelete: () => removeSelected(removeUser, 'user'),
      }}
    />
  );
}
