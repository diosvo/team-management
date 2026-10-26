'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { enumLabel } from '@/i18n/enums';
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
  const t = useTranslations('assets.table');
  const tEnums = useTranslations('enums');
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
      header: t('name'),
      cell: (item) => <HighlightText query={q}>{item.name}</HighlightText>,
    },
    {
      header: t('category'),
      cell: (item) => enumLabel(tEnums, 'assetCategory', item.category),
    },
    { header: t('quantity'), cell: (item) => item.quantity },
    {
      header: t('condition'),
      cell: (item) => (
        <Badge
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.condition)}
        >
          {enumLabel(tEnums, 'assetCondition', item.condition)}
        </Badge>
      ),
    },
    { header: t('assignedTo'), cell: (item) => item.user?.name },
    {
      header: t('acquiredDate'),
      cell: (item) => formatDate(item.acquired_date),
    },
    {
      header: t('lastUpdated'),
      cell: (item) => formatDatetime(item.updated_at),
    },
    {
      header: t('note'),
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
        empty={{ title: t('empty') }}
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
