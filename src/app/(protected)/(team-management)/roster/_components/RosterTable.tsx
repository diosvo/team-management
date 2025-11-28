'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge, Highlight, Icon, Table } from '@chakra-ui/react';
import { ShieldAlert, ShieldCheck, SwatchBook } from 'lucide-react';

import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';

import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';
import { paginateData, useCommonParams } from '@/utils/filters';
import { colorState } from '@/utils/helper';

import { removeUser } from '@/actions/user';
import { User } from '@/drizzle/schema/user';

export default function RosterTable({ users }: { users: Array<User> }) {
  const router = useRouter();
  const { isAdmin, isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useCommonParams();

  const [selection, setSelection] = useState<Array<string>>([]);
  const selectionCount = selection.length;

  const totalCount = users.length;
  const currentData = paginateData(users, page);

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const columnCount = useMemo(() => {
    let count = 0;
    if (isAdmin) {
      count += 2; // Checkbox and Verified
    }
    count += 6; // No., Name, Email, State, Roles, Position
    return count;
  }, [isAdmin]);

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

  const mask = (cc: string, num = 4) =>
    `${cc}`.slice(-num).padStart(`${cc}`.length, '*');

  return (
    <>
      <Table.ScrollArea marginTop={2} marginBottom={4}>
        <Table.Root
          size={{ base: 'sm', md: 'md' }}
          stickyHeader
          interactive={totalCount > 0}
        >
          <Table.Header>
            <Table.Row>
              <Visibility isVisible={isAdmin}>
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
                          changes.checked ? users.map(({ id }) => id) : [],
                        );
                      }}
                    />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">
                    Verified
                  </Table.ColumnHeader>
                </>
              </Visibility>
              {['No.', 'Name', 'Email', 'State', 'Roles', 'Position'].map(
                (column: string) => (
                  <Table.ColumnHeader key={column}>{column}</Table.ColumnHeader>
                ),
              )}
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
                  <Visibility isVisible={isAdmin}>
                    <>
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
                          <Icon as={ShieldCheck} size="sm" color="green.500" />
                        ) : (
                          <Icon as={ShieldAlert} size="sm" color="orange.500" />
                        )}
                      </Table.Cell>
                    </>
                  </Visibility>
                  <Table.Cell>{user.player?.jersey_number ?? '-'}</Table.Cell>
                  <Table.Cell>
                    <Highlight query={q} styles={{ backgroundColor: 'yellow' }}>
                      {isGuest ? mask(user.name, -4) : user.name}
                    </Highlight>
                  </Table.Cell>
                  <Table.Cell>
                    <Highlight query={q} styles={{ backgroundColor: 'yellow' }}>
                      {isGuest ? mask(user.email, -4) : user.email}
                    </Highlight>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={colorState(user.state)}
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
