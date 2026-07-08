'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Badge, Icon } from '@chakra-ui/react';
import { ShieldAlert, ShieldCheck, SwatchBook } from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useRosterFilters } from '@/lib/nuqs';
import { buildPredicate } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { removeUser } from '@/actions/user';
import { User } from '@/drizzle/schema/user';

const mask = (cc: string, num = 4) =>
  `${cc}`.slice(-num).padStart(`${cc}`.length, '*');

export default function RosterTable({ users }: { users: Array<User> }) {
  const router = useRouter();
  const { isAdmin, isCaptain, isGuest } = usePermissions();
  const [{ q, page, state, role }, setSearchParams] = useRosterFilters();

  const canManage = isAdmin || isCaptain;

  const predicate = useMemo(
    () =>
      buildPredicate<User>({
        search: { query: q, fields: ['name', 'email'] },
        match: { state, role },
      }),
    [q, state, role],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(users, predicate, page);

  const removeUsers = async () => {
    const results = await Promise.all(selection.map(removeUser));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Deleted ${successCount} user(s), but some operations failed.`
        : `Successfully deleted ${successCount} user(s).`,
    });

    setSelection([]);
  };

  const columns: Array<Column<User>> = [
    ...(canManage
      ? [
          {
            header: 'Verified',
            align: 'center',
            cell: (user: User) =>
              user.emailVerified ? (
                <Icon as={ShieldCheck} size="sm" color="green.500" />
              ) : (
                <Icon as={ShieldAlert} size="sm" color="orange.500" />
              ),
          } satisfies Column<User>,
        ]
      : []),
    { header: 'No.', cell: (user) => user.player?.jersey_number ?? '-' },
    {
      header: 'Name',
      cell: (user) => (
        <HighlightText query={q}>
          {isGuest ? mask(user.name, -4) : user.name}
        </HighlightText>
      ),
    },
    {
      header: 'Email',
      cell: (user) => (
        <HighlightText query={q}>
          {isGuest ? mask(user.email, -4) : user.email}
        </HighlightText>
      ),
    },
    {
      header: 'State',
      cell: (user) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(user.state)}
        >
          {user.state}
        </Badge>
      ),
    },
    {
      header: 'Roles',
      cell: (user) => (
        <Badge variant="outline" borderRadius="full">
          {user.role}
        </Badge>
      ),
    },
    {
      header: 'Position',
      cell: (user) =>
        user.player?.position ? (
          <Badge variant="outline" borderRadius="full">
            {user.player.position}
          </Badge>
        ) : (
          '-'
        ),
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
      empty={{ title: 'No users found', icon: <SwatchBook /> }}
      stickyHeader
      onRowClick={
        isGuest ? undefined : (user) => router.replace('/profile/' + user.id)
      }
      selection={{
        canSelect: canManage,
        items,
        selection,
        setSelection,
        onDelete: removeUsers,
      }}
    />
  );
}
