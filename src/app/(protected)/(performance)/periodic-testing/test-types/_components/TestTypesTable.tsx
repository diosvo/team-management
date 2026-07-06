'use client';

import { useMemo } from 'react';

import { formatDistanceToNow } from 'date-fns';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useTestTypeFilters } from '@/lib/nuqs';
import { buildPredicate } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';

import { removeTestType } from '@/actions/test-type';
import { TestType } from '@/drizzle/schema';

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
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(data, predicate, page);

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

  const columns: Array<Column<TestType>> = [
    {
      header: 'Name',
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    { header: 'Unit', cell: (item) => item.unit },
    { header: 'Last Updated', cell: (item) => formatDatetime(item.updated_at) },
    {
      header: '',
      cell: (item) =>
        formatDistanceToNow(item.updated_at, { addSuffix: true }),
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
          onDelete: removeItems,
        }}
      />
      <UpsertTestType.Viewport />
    </>
  );
}
