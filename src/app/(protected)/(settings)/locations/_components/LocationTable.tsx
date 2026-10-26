'use client';

import { useMemo } from 'react';

import { MapPinXInside } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LocationLink } from '@/components/common/LocationSelection';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/lib/nuqs';
import { formatDatetime } from '@/utils/datetime';
import { buildPredicate } from '@/utils/filters';

import { removeLocation } from '@/actions/location';
import type { Location } from '@/drizzle/schema';

import { UpsertLocation } from './UpsertLocation';

export default function LocationTable({
  locations,
}: {
  locations: Array<Location>;
}) {
  const t = useTranslations('locations.table');
  const { can, isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useCommonParams();

  const predicate = useMemo(
    () =>
      buildPredicate<Location>({
        search: { query: q, fields: ['name', 'address'] },
      }),
    [q],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(locations, predicate, page);

  const columns: Array<Column<Location>> = [
    {
      header: t('name'),
      cell: (item) => (
        <LocationLink name={item.name}>
          <HighlightText query={q}>{item.name}</HighlightText>
        </LocationLink>
      ),
    },
    {
      header: t('address'),
      cell: (item) => <HighlightText query={q}>{item.address}</HighlightText>,
    },
    {
      header: t('lastUpdated'),
      cell: (item) => formatDatetime(item.updated_at),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(item) => item.location_id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: t('empty'), icon: <MapPinXInside /> }}
        onRowClick={
          isGuest
            ? undefined
            : (item) =>
                UpsertLocation.open('update-location', {
                  action: 'Update',
                  item,
                })
        }
        selection={{
          canSelect: can('locations', 'delete'),
          items,
          selection,
          setSelection,
          disabled: isPending,
          onDelete: () => removeSelected(removeLocation, 'location'),
        }}
      />
      <UpsertLocation.Viewport />
    </>
  );
}
