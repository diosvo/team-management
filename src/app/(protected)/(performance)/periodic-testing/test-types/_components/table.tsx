'use client';

import { useState } from 'react';

import { ActionBar, Button, Portal, Table } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

import Pagination from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import { TestType } from '@/drizzle/schema';
import { formatDatetime } from '@/utils/formatter';

import { removeTestType } from '@/features/periodic-testing/actions/test-type';

import { UpsertTestType } from './upsert-type';

export default function TestTypesTable({ data }: { data: Array<TestType> }) {
  const [selection, setSelection] = useState<Array<string>>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
  });

  const totalCount = data.length;
  const selectionCount = selection.length;

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeTestType));
    const hasErrors = results.some(({ error }) => error);
    const successCount = results.filter((result) => !result.error).length;
    const errorMessages = results
      .filter(({ error }) => error)
      .map(({ message }) => message)
      .join('\n ');

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      description: hasErrors
        ? `Deleted ${successCount} type(s), but some operations failed: ${errorMessages}`
        : `Successfully deleted ${successCount} type(s).`,
    });

    setSelection([]);
  };

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={data.length > 0}
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                <Checkbox
                  top={0.5}
                  aria-label="Select all rows"
                  checked={indeterminate ? 'indeterminate' : selectionCount > 0}
                  onCheckedChange={(changes) => {
                    setSelection(
                      changes.checked ? data.map(({ type_id }) => type_id) : []
                    );
                  }}
                />
              </Table.ColumnHeader>
              {['Name', 'Unit', 'Last Updated', ''].map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.length > 0 ? (
              data.map((item) => (
                <Table.Row
                  key={item.type_id}
                  _hover={{ cursor: 'pointer' }}
                  onClick={() => {
                    UpsertTestType.open('update-test-type', {
                      action: 'Update',
                      item,
                    });
                  }}
                >
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      top={0.5}
                      aria-label="Select row"
                      checked={selection.includes(item.type_id)}
                      onCheckedChange={(changes) => {
                        setSelection((prev) =>
                          changes.checked
                            ? [...prev, item.type_id]
                            : selection.filter((id) => id !== item.type_id)
                        );
                      }}
                    />
                  </Table.Cell>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>{item.unit}</Table.Cell>
                  <Table.Cell>{formatDatetime(item.updated_at)}</Table.Cell>
                  <Table.Cell color="GrayText">
                    {formatDistanceToNow(item.updated_at, {
                      addSuffix: true,
                    })}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <EmptyState title="No matching names found" />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={data.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      />

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
                onClick={removeItems}
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
