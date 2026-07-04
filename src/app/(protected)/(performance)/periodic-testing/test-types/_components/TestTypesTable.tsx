'use client';

import { useCallback } from 'react';

import { Table } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

import Authorized from '@/components/Authorized';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useTestTypeFilters } from '@/lib/nuqs';
import { formatDatetime } from '@/utils/formatter';

import { removeTestType } from '@/actions/test-type';
import { TestType } from '@/drizzle/schema';

import { UpsertTestType } from './UpsertTestType';

const HEADERS = ['Name', 'Unit', 'Last Updated', ''] as const;

export default function TestTypesTable({ data }: { data: Array<TestType> }) {
  const { isGuest } = usePermissions();
  const [{ q, page, unit }, setSearchParams] = useTestTypeFilters();

  const predicate = useCallback(
    (item: TestType) =>
      item.name.toLowerCase().includes(q.toLowerCase()) &&
      (unit.length === 0 || unit.includes(item.unit)),
    [q, unit],
  );
  const {
    items,
    currentData,
    indeterminate,
    selection,
    setSelection,
    hasSelection,
    totalCount,
    columnCount,
    selectionCount,
  } = useTableState(data, predicate, page, {
    headerCount: HEADERS.length,
  });

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
        ? `${successCount} deleted, some operations failed: ${errorMessages}`
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
              <Authorized resource="periodic-testing" action="delete">
                <Table.ColumnHeader width={4}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) =>
                      setSelection(
                        changes.checked
                          ? items.map(({ type_id }) => type_id)
                          : [],
                      )
                    }
                  />
                </Table.ColumnHeader>
              </Authorized>
              {HEADERS.map((header, index) => (
                <Table.ColumnHeader key={index}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row
                  key={item.type_id}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    UpsertTestType.open('update-test-type', {
                      action: 'Update',
                      item,
                    });
                  }}
                >
                  <Authorized resource="periodic-testing" action="delete">
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.type_id)}
                        onCheckedChange={(changes) =>
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.type_id]
                              : selection.filter((id) => id !== item.type_id),
                          )
                        }
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <HighlightText query={q}>{item.name}</HighlightText>
                  </Table.Cell>
                  <Table.Cell>{item.unit}</Table.Cell>
                  <Table.Cell>{formatDatetime(item.updated_at)}</Table.Cell>
                  <Table.Cell color="GrayText">
                    {formatDistanceToNow(item.updated_at, { addSuffix: true })}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
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
      <SelectionActionBar
        open={hasSelection}
        selectionCount={selectionCount}
        onDelete={removeItems}
      />
      <UpsertTestType.Viewport />
    </>
  );
}
