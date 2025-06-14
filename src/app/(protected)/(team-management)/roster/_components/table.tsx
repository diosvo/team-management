'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  ActionBar,
  Badge,
  Button,
  ButtonGroup,
  Icon,
  IconButton,
  Pagination,
  Portal,
  Table,
} from '@chakra-ui/react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  SwatchBook,
} from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema/user';
import { usePermissions } from '@/hooks/use-permissions';
import { colorState } from '@/utils/helper';

import { removeUser } from '@/features/user/actions/user';

export default function RosterTable({ users }: { users: Array<User> }) {
  const router = useRouter();
  const { isAdmin, isGuest } = usePermissions();

  const [selection, setSelection] = useState<Array<string>>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });

  const totalCount = users.length;
  const selectionCount = selection.length;

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  // Calculate the users to show for the current page
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(startIndex + pagination.pageSize, totalCount);
  const currentData = users.slice(startIndex, endIndex);

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
    const hasErrors = results.some(({ error }) => error);
    const successCount = results.filter((result) => !result.error).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      description: hasErrors
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
          interactive={currentData.length > 0}
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
                          changes.checked
                            ? users.map(({ user_id }) => user_id)
                            : []
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
                )
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((user) => (
                <Table.Row
                  key={user.user_id}
                  data-selected={
                    selection.includes(user.user_id) ? '' : undefined
                  }
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    router.replace('/profile/' + user.user_id);
                  }}
                >
                  <Visibility isVisible={isAdmin}>
                    <>
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          top={0.5}
                          aria-label="Select row"
                          checked={selection.includes(user.user_id)}
                          onCheckedChange={(changes) => {
                            setSelection((prev) =>
                              changes.checked
                                ? [...prev, user.user_id]
                                : selection.filter((id) => id !== user.user_id)
                            );
                          }}
                        />
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {user.password ? (
                          <Icon
                            as={ShieldCheck}
                            size={{ base: 'sm', md: 'md' }}
                            color="green.500"
                          />
                        ) : (
                          <Icon
                            as={ShieldAlert}
                            size={{ base: 'sm', md: 'md' }}
                            color="orange.500"
                          />
                        )}
                      </Table.Cell>
                    </>
                  </Visibility>
                  <Table.Cell>{user.details.jersey_number ?? '-'}</Table.Cell>
                  <Table.Cell>
                    {isGuest ? mask(user.name, -4) : user.name}
                  </Table.Cell>
                  <Table.Cell>
                    {isGuest ? mask(user.email, -4) : user.email}
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
                    {user.details.position ? (
                      <Badge variant="outline" borderRadius="full">
                        {user.details.position}
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
                  <EmptyState
                    icon={<SwatchBook />}
                    title="No users found"
                    description="Try adjusting your search"
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination.Root
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        opacity={totalCount > 0 ? 1 : 0}
        count={totalCount}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      >
        <Pagination.PageText format="long" fontSize={14} />
        <ButtonGroup variant="ghost" size={{ base: 'xs', sm: 'sm' }}>
          <Pagination.PrevTrigger asChild>
            <IconButton aria-label="Previous page">
              <ChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>
          <Pagination.NextTrigger asChild>
            <IconButton aria-label="Next page">
              <ChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>

      <ActionBar.Root open={hasSelection}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <ActionBar.SelectionTrigger>
                {selectionCount} selected
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={removeUsers}
              >
                Delete
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </>
  );
}
