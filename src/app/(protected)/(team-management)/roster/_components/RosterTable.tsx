'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { Badge, Icon, Table } from '@chakra-ui/react';
import { Check, Loader, SwatchBook } from 'lucide-react';

import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import Visibility from '@/components/Visibility';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useRosterFilters } from '@/lib/nuqs';
import { getColor } from '@/utils/helper';

import { removeUser } from '@/actions/user';
import { User } from '@/drizzle/schema/user';

const HEADERS = ['No.', 'Name', 'Email', 'State', 'Roles', 'Position'] as const;

const mask = (cc: string, num = 4) =>
  `${cc}`.slice(-num).padStart(`${cc}`.length, '*');

export default function RosterTable({ users }: { users: Array<User> }) {
  const router = useRouter();
  const { isAdmin, isCaptain, isGuest } = usePermissions();
  const [{ q, page, state, role }, setSearchParams] = useRosterFilters();

  const canManage = isAdmin || isCaptain;

  const predicate = useCallback(
    (user: User) =>
      (user.name.toLowerCase().includes(q.toLowerCase()) ||
        user.email.toLowerCase().includes(q.toLowerCase())) &&
      (state.length === 0 || state.includes(user.state)) &&
      (role.length === 0 || role.includes(user.role)),
    [q, state, role],
  );

  const {
    items,
    currentData,
    indeterminate,
    selection,
    setSelection,
    hasSelection,
    totalCount,
    selectionCount,
  } = useTableState(users, predicate, page);

  // No., Name, Email, State, Roles, Position (+ checkbox & verified for managers)
  const columnCount = useMemo(
    () => HEADERS.length + (canManage ? 2 : 0),
    [canManage],
  );

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

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          stickyHeader
          interactive={totalCount > 0}
        >
          <Table.Header>
            <Table.Row>
              <Visibility isVisible={canManage}>
                <>
                  <Table.ColumnHeader width={6}>
                    <Checkbox
                      top={0.5}
                      aria-label="Select all rows"
                      checked={
                        indeterminate ? 'indeterminate' : selectionCount > 0
                      }
                      onCheckedChange={(changes) => {
                        setSelection(
                          changes.checked ? items.map(({ id }) => id) : [],
                        );
                      }}
                    />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">
                    Verified
                  </Table.ColumnHeader>
                </>
              </Visibility>
              {HEADERS.map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((user) => (
                <Table.Row
                  key={user.id}
                  data-selected={selection.includes(user.id) ? '' : undefined}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    router.replace('/profile/' + user.id);
                  }}
                >
                  <Visibility isVisible={canManage}>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(user.id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, user.id]
                              : selection.filter((id) => id !== user.id),
                          );
                        }}
                      />
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      {user.emailVerified ? (
                        <Icon as={Check} size="sm" color="green.500" />
                      ) : (
                        <Icon as={Loader} size="sm" color="orange.500" />
                      )}
                    </Table.Cell>
                  </Visibility>
                  <Table.Cell>{user.player?.jersey_number ?? '-'}</Table.Cell>
                  <Table.Cell>
                    <HighlightText query={q}>
                      {isGuest ? mask(user.name, -4) : user.name}
                    </HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <HighlightText query={q}>
                      {isGuest ? mask(user.email, -4) : user.email}
                    </HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={getColor(user.state)}
                    >
                      {user.state}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline" borderRadius="full">
                      {user.role}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {user.player?.position ? (
                      <Badge variant="outline" borderRadius="full">
                        {user.player.position}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState icon={<SwatchBook />} title="No users found" />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={totalCount}
        page={page}
        onPageChange={setSearchParams}
      />
      <SelectionActionBar
        open={hasSelection}
        selectionCount={selectionCount}
        onDelete={removeUsers}
      />
    </>
  );
}
