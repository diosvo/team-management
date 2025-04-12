'use client';

import { Table } from '@chakra-ui/react';
import { ReactNode } from 'react';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  width?: string;
  render?: (value: any, row: T, rowIndex: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: (row: T, rowIndex: number) => ReactNode;
  emptyState?: ReactNode;
}

export function DataTable<T extends object>({
  columns,
  data,
  actions,
  emptyState,
}: DataTableProps<T>) {
  return (
    <Table.Root variant="outline">
      <Table.Header>
        <Table.Row>
          {columns.map((column, index) => (
            <Table.ColumnHeader key={index} width={column.width}>
              {column.header}
            </Table.ColumnHeader>
          ))}
          {actions && <Table.ColumnHeader width="80px"></Table.ColumnHeader>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.length > 0 ? (
          data.map((row, rowIndex) => (
            <Table.Row key={rowIndex}>
              {columns.map((column, colIndex) => (
                <Table.Cell key={colIndex}>
                  {column.render
                    ? column.render(
                        typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : row[column.accessor],
                        row,
                        rowIndex
                      )
                    : typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : String(row[column.accessor])}
                </Table.Cell>
              ))}
              {actions && <Table.Cell>{actions(row, rowIndex)}</Table.Cell>}
            </Table.Row>
          ))
        ) : (
          <Table.Row>
            <Table.Cell colSpan={columns.length + (actions ? 1 : 0)}>
              {emptyState || 'No data available'}
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Root>
  );
}
