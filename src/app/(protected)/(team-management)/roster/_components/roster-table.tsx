'use client';

import { useState } from 'react';

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
  Pagination,
  Portal,
  Table,
  VStack,
} from '@chakra-ui/react';
import {
  ChevronLeft,
  ChevronRight,
  SwatchBook,
  UserRoundPlus,
} from 'lucide-react';

import { toaster } from '@/components/ui/toaster';

import { User } from '@/drizzle/schema';
import { colorState } from '@/utils/helper';

import { removeUser } from '@/features/user/actions/user';

export function RosterTable({ users }: { users: Array<User> }) {
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

  const removeUsers = () => {
    selection.forEach(async (user_id: string) => {
      const { error, message: description } = await removeUser(user_id);

      toaster.create({
        type: error ? 'error' : 'success',
        description,
      });
    });

    setSelection([]);
  };

  return (
    <Box>
      <HStack justifyContent="space-between">
        <Heading as="h1" size="xl">
          Team Roster
        </Heading>
        <Button size="sm">
          <UserRoundPlus />
          Add User
        </Button>
      </HStack>
      <Table.ScrollArea my={6}>
        <Table.Root stickyHeader interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="6">
                <Checkbox.Root
                  size="sm"
                  top="0.5"
                  aria-label="Select all rows"
                  checked={indeterminate ? 'indeterminate' : selectionCount > 0}
                  onCheckedChange={(changes) => {
                    setSelection(
                      changes.checked ? users.map(({ user_id }) => user_id) : []
                    );
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.ColumnHeader>
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
                  onClick={() => console.log('roster_table')}
                  _hover={{ cursor: 'pointer' }}
                >
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <Checkbox.Root
                      size="sm"
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
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
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
                      <Badge key={role} variant="outline" borderRadius="full">
                        {role}
                      </Badge>
                    ))}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <SwatchBook />
                      </EmptyState.Indicator>
                      <VStack textAlign="center">
                        <EmptyState.Title>No results found</EmptyState.Title>
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
        count={totalCount}
        pageSize={pagination.pageSize}
        page={pagination.page}
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
    </Box>
  );
}
