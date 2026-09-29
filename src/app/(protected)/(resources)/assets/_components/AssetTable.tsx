'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import { Badge } from '@chakra-ui/react';
import { capitalize } from 'es-toolkit/string';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useAssetFilters } from '@/lib/nuqs';
import { formatDate, formatDatetime } from '@/utils/datetime';
import { buildPredicate } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { removeAsset } from '@/actions/asset';
import type { Asset } from '@/drizzle/schema/asset';

import { UpsertAsset } from './UpsertAsset';

const RichTextViewer = dynamic(
  () => import('@/components/editor/RichTextViewer'),
  { ssr: false },
);

export default function AssetTable({ data }: { data: Array<Asset> }) {
  const { can, isGuest } = usePermissions();
  const [{ q, page, category, condition, from, to }, setSearchParams] =
    useAssetFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<Asset>({
        search: { query: q, fields: ['name'] },
        match: { category, condition },
        within: { field: 'acquired_date', range: { from, to } },
      }),
    [q, category, condition, from, to],
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

  const columns: Array<Column<Asset>> = [
    {
      header: 'Name',
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    {
      header: 'Category',
      cell: (item) => capitalize(item.category),
    },
    { header: 'Quantity', cell: (item) => item.quantity },
    {
      header: 'Condition',
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.condition)}
        >
          {capitalize(item.condition)}
        </Badge>
      ),
    },
    { header: 'Assigned To', cell: (item) => item.user?.name },
    { header: 'Acquired Date', cell: (item) => formatDate(item.acquired_date) },
    { header: 'Last Updated', cell: (item) => formatDatetime(item.updated_at) },
    {
      header: 'Note',
      cell: (item) => item.note && <RichTextViewer content={item.note} />,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.asset_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: 'No assets found' }}
        onRowClick={
          isGuest
            ? undefined
            : (item) =>
                UpsertAsset.open('update-asset', { action: 'Update', item })
        }
        selection={{
          canSelect: can('assets', 'delete'),
          items,
          selection,
          setSelection,
          disabled: isPending,
          onDelete: () => removeSelected(removeAsset, 'asset'),
        }}
      />
      <UpsertAsset.Viewport />
    </>
  );
}
