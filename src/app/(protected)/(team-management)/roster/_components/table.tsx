'use client';

import { useMemo, useRef, useState } from 'react';

import {
  ActionBar,
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  Icon,
  IconButton,
  Pagination,
  Portal,
  Table,
  VStack,
} from '@chakra-ui/react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  SwatchBook,
} from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { dialog } from '@/components/ui/dialog';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import { usePermissions } from '@/hooks/use-permissions';
import { colorState } from '@/utils/helper';

import UserInfo from '@/app/(protected)/_components/user-info';
import { removeUser } from '@/features/user/actions/user';
import { formatDate } from '@/utils/formatter';

export default function RosterTable({ users }: { users: Array<User> }) {
  const { isAdmin } = usePermissions();
  const selectionRef = useRef<HTMLDivElement>(null);

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
    count += 7; // Remaining columns
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
              {[
                'No.',
                'Name',
                'DOB',
                'Email',
                'State',
                'Roles',
                'Position',
              ].map((column: string) => (
                <Table.ColumnHeader key={column}>{column}</Table.ColumnHeader>
              ))}
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
                  _hover={{ cursor: 'pointer' }}
                  onClick={() =>
                    dialog.open('profile', {
                      contentRef: selectionRef,
                      children: (
                        <UserInfo
                          user={user}
                          canEdit={isAdmin}
                          isAdmin={isAdmin}
                          selectionRef={selectionRef}
                        />
                      ),
                      closeOnInteractOutside: true,
                    })
                  }
                >
                  <Visibility isVisible={isAdmin}>
                    <>
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          top="0.5"
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
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell> {formatDate(user.dob)}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      rounded="full"
                      colorPalette={colorState(user.state)}
                    >
                      {user.state}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline" rounded="full">
                      {user.role}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {user.details.position ? (
                      <Badge variant="outline" rounded="full">
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
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <SwatchBook />
                      </EmptyState.Indicator>
                      <VStack textAlign="center">
                        <EmptyState.Title>No users found</EmptyState.Title>
                        <EmptyState.Description>
                          Try adjusting your search
                        </EmptyState.Description>
                      </VStack>
                    </EmptyState.Content>
                  </EmptyState.Root>
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
                variant="outline"
                colorPalette="red"
                size="sm"
                onClick={removeUsers}
              >
                Delete
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
      <dialog.Viewport />
    </>
  );
}
