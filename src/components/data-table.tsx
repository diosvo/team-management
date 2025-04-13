'use client';

import {
  ButtonGroup,
  IconButton,
  Pagination,
  Table,
  VStack,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode, useState } from 'react';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T;
  width?: string;
  flex?: number;
  render?: (value: any, row: T, rowIndex: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: (row: T, rowIndex: number) => ReactNode;
  showPagination?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  actions,
  showPagination = false,
}: DataTableProps<T>) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });

  // Calculate the items to show for the current page
  const totalCount = data.length;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(startIndex + pagination.pageSize, totalCount);
  const currentData = data.slice(startIndex, endIndex);

  return (
    <VStack gap={4} alignItems="stretch">
      <Table.ScrollArea borderWidth="1px">
        <Table.Root variant="outline" stickyHeader width="100%">
          <Table.Header>
            <Table.Row>
              {columns.map((column, index) => (
                <Table.ColumnHeader
                  key={index}
                  width="auto"
                  flex={column.flex || 1}
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {column.header}
                </Table.ColumnHeader>
              ))}
              {actions && (
                <Table.ColumnHeader
                  width="80px"
                  flex="0 0 auto"
                ></Table.ColumnHeader>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <Table.Row key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <Table.Cell
                      key={colIndex}
                      width={column.width || 'auto'}
                      flex={column.flex || 1}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {column.render
                        ? column.render(row[column.accessor], row, rowIndex)
                        : String(row[column.accessor] || '-')}
                    </Table.Cell>
                  ))}
                  {actions && (
                    <Table.Cell width="80px" flex="0 0 auto">
                      {actions(row, rowIndex)}
                    </Table.Cell>
                  )}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columns.length + (actions ? 1 : 0)}>
                  {'No data found.'}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      {showPagination && totalCount > 0 && (
        <Pagination.Root
          count={totalCount}
          pageSize={pagination.pageSize}
          page={pagination.page}
          onPageChange={({ page }) =>
            setPagination((prev) => ({ ...prev, page }))
          }
          alignSelf="flex-end"
        >
          <ButtonGroup variant="ghost" size="sm">
            <Pagination.PageText
              format="long"
              flex="1"
              fontWeight="normal"
              fontSize="14px"
            />

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
      )}
    </VStack>
  );
}
