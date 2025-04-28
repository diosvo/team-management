'use client';

import { use, useRef, useState } from 'react';

import {
  ActionBar,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  EmptyState,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Kbd,
  Pagination,
  Portal,
  Table,
  VStack,
} from '@chakra-ui/react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SwatchBook,
  UserRoundPlus,
} from 'lucide-react';

import { dialog } from '@/components/ui/dialog';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import { useUser } from '@/hooks/use-user';
import { UserRole } from '@/utils/enum';
import { colorState } from '@/utils/helper';

import UserInfo from '@/app/(protected)/_components/user-info';
import { removeUser } from '@/features/user/actions/user';
import AddUser from './add-user';

interface RosterTableProps {
  users: Array<User>;
}

export function RosterTable({ users }: RosterTableProps) {
  const { userPromise } = useUser();
  const currentUser = use(userPromise);
  const isAdmin = currentUser!.roles.includes(UserRole.SUPER_ADMIN);
  const dialogContentRef = useRef<HTMLDivElement>(null);

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
    <Box>
      <Heading as="h1" size="xl">
        Team Roster
      </Heading>
      <HStack marginBlock={6}>
        <InputGroup
          flex="1"
          startElement={<Search size={14} />}
          endElement={
            <Kbd size="sm" variant="outline">
              Enter
            </Kbd>
          }
        >
          <Input
            placeholder="Search..."
            borderWidth="1px"
            css={{ '--focus-color': 'colors.orange.200' }}
          />
        </InputGroup>
        <Button variant="surface" disabled>
          <Filter />
          Filters
        </Button>
        <Visibility isVisible={isAdmin}>
          <Button
            onClick={() =>
              dialog.open('add-user', {
                contentRef: dialogContentRef,
                children: (
                  <AddUser
                    users={users}
                    currentMail={currentUser!.email}
                    containerRef={dialogContentRef}
                  />
                ),
              })
            }
          >
            <UserRoundPlus />
            Add User
          </Button>
        </Visibility>
      </HStack>

      <Table.ScrollArea>
        <Table.Root stickyHeader interactive={currentData.length > 0}>
          <Table.Header>
            <Table.Row>
              <Visibility isVisible={isAdmin}>
                <Table.ColumnHeader width={6}>
                  <Checkbox.Root
                    size="sm"
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
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
              </Visibility>
              <Table.ColumnHeader>No.</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Email</Table.ColumnHeader>
              <Table.ColumnHeader>State</Table.ColumnHeader>
              <Table.ColumnHeader>Roles</Table.ColumnHeader>
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
                    dialog.open('user-info', {
                      children: <UserInfo user={user} isAdmin={isAdmin} />,
                    })
                  }
                >
                  <Visibility isVisible={isAdmin}>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox.Root
                        size="sm"
                        top="0.5"
                        aria-label="Select row"
                        checked={selection.includes(user.user_id)}
                        readOnly={currentUser?.user_id === user.user_id}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, user.user_id]
                              : selection.filter((id) => id !== user.user_id)
                          );
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                  </Visibility>
                  <Table.Cell>-</Table.Cell>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
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
                    {user.roles.map((role: string) => (
                      <Badge
                        key={role}
                        variant="outline"
                        borderRadius="full"
                        marginRight={2}
                      >
                        {role}
                      </Badge>
                    ))}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={6}>
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
        marginTop={6}
        opacity={totalCount > 0 ? 1 : 0}
        count={totalCount}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      >
        <Pagination.PageText
          format="long"
          flex="1"
          fontWeight="normal"
          fontSize="14px"
        />

        <ButtonGroup variant="ghost" size="sm">
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
    </Box>
  );
}
