'use client';

import { useState } from 'react';

import { toaster } from '@/components/ui/toaster';
import { User } from '@/drizzle/schema';
import { removeUser } from '@/features/user/actions/user';
import {
  ActionBar,
  Box,
  Button,
  Checkbox,
  HStack,
  Kbd,
  Portal,
  Table,
  Text,
} from '@chakra-ui/react';

export default function BulkUserActions({ roster }: { roster: Array<User> }) {
  const [selection, setSelection] = useState<string[]>([]);

  const hasSelection = selection.length > 0;
  const indeterminate = hasSelection && selection.length < roster.length;

  const rows = roster.map((item) => (
    <Table.Row
      key={item.user_id}
      data-selected={selection.includes(item.user_id) ? '' : undefined}
    >
      <Table.Cell>
        <Checkbox.Root
          size="sm"
          top="0.5"
          aria-label="Select row"
          checked={selection.includes(item.user_id)}
          onCheckedChange={(changes) => {
            setSelection((prev) =>
              changes.checked
                ? [...prev, item.user_id]
                : selection.filter((user_id) => user_id !== item.user_id)
            );
          }}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      </Table.Cell>
      <Table.Cell>{item.name}</Table.Cell>
      <Table.Cell>{item.email}</Table.Cell>
      <Table.Cell>{item.roles.join(', ')}</Table.Cell>
    </Table.Row>
  ));

  const removeUsers = () => {
    selection.forEach(async (user_id: string) => {
      const { error, message } = await removeUser(user_id);

      toaster.create({
        type: error ? 'error' : 'success',
        description: message,
      });
    });

    setSelection([]);
  };

  return (
    <Box w="full">
      <HStack justifyContent="space-between" mb={5}>
        <Text textStyle="md" fontWeight="semibold">
          Bulk Actions
        </Text>
      </HStack>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="6">
              <Checkbox.Root
                size="sm"
                top="0.5"
                aria-label="Select all rows"
                checked={indeterminate ? 'indeterminate' : selection.length > 0}
                onCheckedChange={(changes) => {
                  setSelection(
                    changes.checked ? roster.map((item) => item.user_id) : []
                  );
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Table.ColumnHeader>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Email</Table.ColumnHeader>
            <Table.ColumnHeader>Roles</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>{rows}</Table.Body>
      </Table.Root>

      <ActionBar.Root open={hasSelection}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <ActionBar.SelectionTrigger>
                {selection.length} selected
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <Button variant="outline" size="sm" onClick={removeUsers}>
                Delete <Kbd>⌫</Kbd>
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </Box>
  );
}
