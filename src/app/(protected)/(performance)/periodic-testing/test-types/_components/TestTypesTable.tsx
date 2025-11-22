'use client';

import { useState } from 'react';

import { ActionBar, Button, Portal, Table } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

import Pagination from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import { paginateData, useCommonParams } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';

import { removeTestType } from '@/actions/test-type';
import { TestType } from '@/drizzle/schema';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesTable({ data }: { data: Array<TestType> }) {
  const [{ page }, setSearchParams] = useCommonParams();

  const [selection, setSelection] = useState<Array<string>>([]);
  const selectionCount = selection.length;

  const totalCount = data.length;
  const currentData = paginateData(data, page);

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeTestType));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;
    const errorMessages = results
      .filter(({ success }) => !success)
      .map(({ message }) => message)
      .join('\n ');

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `${successCount} deleted, but some operations failed: ${errorMessages}`
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
          interactive={totalCount > 0}
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                <Checkbox
                  top={0.5}
                  aria-label="Select all rows"
                  checked={indeterminate ? 'indeterminate' : selectionCount > 0}
                  onCheckedChange={(changes) =>
                    setSelection(
                      changes.checked ? data.map(({ type_id }) => type_id) : []
                    )
                  }
                />
              </Table.ColumnHeader>
              {['Name', 'Unit', 'Last Updated', ''].map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row
                  key={item.type_id}
                  _hover={{ cursor: 'pointer' }}
                  onClick={() =>
                    UpsertTestType.open('update-test-type', {
                      action: 'Update',
                      item,
                    })
                  }
                >
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      top={0.5}
                      aria-label="Select row"
                      checked={selection.includes(item.type_id)}
                      onCheckedChange={(changes) =>
                        setSelection((prev) =>
                          changes.checked
                            ? [...prev, item.type_id]
                            : selection.filter((id) => id !== item.type_id)
                        )
                      }
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
        count={totalCount}
        page={page}
        onPageChange={setSearchParams}
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
