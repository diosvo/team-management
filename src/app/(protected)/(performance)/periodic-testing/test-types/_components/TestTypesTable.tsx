'use client';

import { useMemo } from 'react';

import { VisuallyHidden } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useTestTypeFilters } from '@/lib/nuqs';
import { formatDatetime } from '@/utils/datetime';
import { buildPredicate } from '@/utils/filters';

import { removeTestType } from '@/actions/test-type';
import type { TestType } from '@/drizzle/schema';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesTable({ data }: { data: Array<TestType> }) {
  const { can, isGuest } = usePermissions();
  const [{ q, page, unit }, setSearchParams] = useTestTypeFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<TestType>({
        search: { query: q, fields: ['name'] },
        match: { unit },
      }),
    [q, unit],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(data, predicate, page);

  const columns: Array<Column<TestType>> = [
    {
      header: 'Name',
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    { header: 'Unit', cell: (item) => item.unit },
    { header: 'Last Updated', cell: (item) => formatDatetime(item.updated_at) },
    {
      // Named for screen readers only: the column repeats "Last Updated" as a
      // relative time, so a visible header would be redundant.
      header: <VisuallyHidden>Relative time</VisuallyHidden>,
      cell: (item) => formatDistanceToNow(item.updated_at, { addSuffix: true }),
      cellProps: { color: 'GrayText' },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.type_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: 'No matching names found' }}
        onRowClick={
          isGuest
            ? undefined
            : (item) =>
                UpsertTestType.open('update-test-type', {
                  action: 'Update',
                  item,
                })
        }
        selection={{
          canSelect: can('periodic-testing', 'delete'),
          items,
          selection,
          setSelection,
          disabled: isPending,
          onDelete: () => removeSelected(removeTestType, 'test type'),
        }}
      />
      <UpsertTestType.Viewport />
    </>
  );
}
