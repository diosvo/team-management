'use client';

import {
  Table,
  type TableCellProps,
  type TableColumnHeaderProps,
  type TableRootProps,
} from '@chakra-ui/react';

import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';

export type Column<T> = Required<{
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
}> &
  Partial<{
    align: 'left' | 'center' | 'right';
    cellProps: TableCellProps;
    headerProps: TableColumnHeaderProps;
  }>;

type Selection<T> = Required<{
  canSelect: boolean;
  items: Array<T>;
  selection: Array<string>;
  onDelete: () => void;
  setSelection: React.Dispatch<React.SetStateAction<Array<string>>>;
}> &
  Partial<{
    disabled: boolean;
    actions: React.ReactNode;
    isSelectable: (item: T) => boolean;
  }>;

type DataTableProps<T> = Required<{
  columns: Array<Column<T>>;
  currentData: Array<T>;
  rowId: (item: T) => string;
  page: number;
  totalCount: number;
  empty: { title: string; description?: string; icon?: React.ReactNode };
  onPageChange: (details: { page: number }) => void;
}> &
  Partial<{
    pageSize: number;
    selection: Selection<T>;
    onRowClick: (item: T) => void;
  }> &
  TableRootProps;

export default function DataTable<T>({
  columns,
  currentData,
  totalCount,
  page,
  pageSize,
  empty,
  selection,
  rowId,
  onPageChange,
  onRowClick,
  ...rootProps
}: DataTableProps<T>) {
  const activeSelection = selection?.canSelect ? selection : null;
  const colSpan = columns.length + (activeSelection ? 1 : 0);

  const canSelectRow = (item: T) =>
    activeSelection?.isSelectable?.(item) ?? true;
  const selectableItems = activeSelection?.items.filter(canSelectRow) ?? [];
  const selectionCount = activeSelection?.selection.length ?? 0;
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < selectableItems.length;

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={totalCount > 0}
          {...rootProps}
        >
          <Table.Header>
            <Table.Row>
              {activeSelection && (
                <Table.ColumnHeader width={6}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    disabled={
                      activeSelection.disabled || selectableItems.length === 0
                    }
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) =>
                      activeSelection.setSelection(
                        changes.checked ? selectableItems.map(rowId) : [],
                      )
                    }
                  />
                </Table.ColumnHeader>
              )}
              {columns.map((column, index) => (
                <Table.ColumnHeader
                  key={index}
                  textAlign={column.align}
                  {...column.headerProps}
                >
                  {column.header}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item, rowIndex) => {
                const id = rowId(item);
                return (
                  <Table.Row
                    key={id}
                    data-selected={
                      activeSelection?.selection.includes(id) ? '' : undefined
                    }
                    _hover={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {activeSelection && (
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          top={0.5}
                          aria-label="Select row"
                          disabled={
                            activeSelection.disabled || !canSelectRow(item)
                          }
                          checked={activeSelection.selection.includes(id)}
                          onCheckedChange={(changes) =>
                            activeSelection.setSelection((prev) =>
                              changes.checked
                                ? [...prev, id]
                                : prev.filter((x) => x !== id),
                            )
                          }
                        />
                      </Table.Cell>
                    )}
                    {columns.map((column, index) => (
                      <Table.Cell
                        key={index}
                        textAlign={column.align}
                        {...column.cellProps}
                      >
                        {column.cell(item, rowIndex) ?? '-'}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={colSpan}>
                  <EmptyState
                    title={empty.title}
                    description={empty.description}
                    icon={empty.icon}
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />

      {activeSelection && (
        <SelectionActionBar
          open={hasSelection}
          selectionCount={selectionCount}
          onDelete={activeSelection.onDelete}
        >
          {activeSelection.actions}
        </SelectionActionBar>
      )}
    </>
  );
}
