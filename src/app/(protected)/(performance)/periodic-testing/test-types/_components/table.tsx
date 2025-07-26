'use client';

import { useState } from 'react';

import { ActionBar, Button, Portal, Table, Text } from '@chakra-ui/react';
import { Box } from 'lucide-react';

import Pagination from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import { TestType } from '@/drizzle/schema';
import { removeTestType } from '@/features/periodic-testing/actions/test-type';
import { formatDate } from '@/utils/formatter';
import { formatDistanceToNow } from 'date-fns';
import { UpsertTestType } from './upsert';

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

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      description: hasErrors
        ? `Deleted ${successCount} types(s), but some operations failed.`
        : `Successfully deleted ${successCount} types(s).`,
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
              {['Name', 'Unit', 'Last Updated'].map((header) => (
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
                  <Table.Cell>
                    <Text>
                      {formatDate(item.updated_at)}
                      <Text
                        as="span"
                        fontSize="xs"
                        color="GrayText"
                        marginLeft={1}
                      >
                        (
                        {formatDistanceToNow(item.updated_at, {
                          addSuffix: true,
                        })}
                        )
                      </Text>
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <EmptyState icon={<Box />} title="No data found" />
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
