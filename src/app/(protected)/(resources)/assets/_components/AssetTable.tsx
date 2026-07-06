'use client';

import { useMemo } from 'react';

import { Badge } from '@chakra-ui/react';
import { capitalize } from 'es-toolkit/string';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useAssetFilters } from '@/lib/nuqs';
import { buildPredicate } from '@/utils/filters';
import { formatDate, formatDatetime } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeAsset } from '@/actions/asset';
import { Asset } from '@/drizzle/schema/asset';

import { UpsertAsset } from './UpsertAsset';

export default function AssetTable({ data }: { data: Array<Asset> }) {
  const { can, isGuest } = usePermissions();
  const [{ q, page, category, condition }, setSearchParams] = useAssetFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<Asset>({
        search: { query: q, fields: ['name'] },
        match: { category, condition },
      }),
    [q, category, condition],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(data, predicate, page);

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeAsset));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Deleted ${successCount} asset(s), but some operations failed.`
        : `Successfully deleted ${successCount} asset(s).`,
    });

    setSelection([]);
  };

  const columns: Array<Column<Asset>> = [
    {
      header: 'Name',
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    {
      header: 'Category',
      cell: (item) => (
        <Badge variant="outline" borderRadius="full">
          {capitalize(item.category)}
        </Badge>
      ),
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
    { header: 'Note', cell: (item) => item.note },
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
          onDelete: removeItems,
        }}
      />
      <UpsertAsset.Viewport />
    </>
  );
}
