'use client';

import { useMemo } from 'react';

import { MapPinXInside } from 'lucide-react';

import { LocationLink } from '@/components/common/LocationSelection';
import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/lib/nuqs';
import { buildPredicate } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';

import { removeLocation } from '@/actions/location';
import { Location } from '@/drizzle/schema';

import { UpsertLocation } from './UpsertLocation';

export default function LocationTable({
  locations,
}: {
  locations: Array<Location>;
}) {
  const { can, isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useCommonParams();

  const predicate = useMemo(
    () =>
      buildPredicate<Location>({
        search: { query: q, fields: ['name', 'address'] },
      }),
    [q],
  );
  const { items, currentData, selection, setSelection, totalCount } =
    useTableState(locations, predicate, page);

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeLocation));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Deleted ${successCount} locations(s), but some operations failed.`
        : `Successfully deleted ${successCount} locations(s).`,
    });

    setSelection([]);
  };

  const columns: Array<Column<Location>> = [
    {
      header: 'Name',
      cell: (item) => (
        <LocationLink name={item.name}>
          <HighlightText query={q}>{item.name}</HighlightText>
        </LocationLink>
      ),
    },
    {
      header: 'Address',
      cell: (item) => <HighlightText query={q}>{item.address}</HighlightText>,
    },
    {
      header: 'Last Updated',
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
        empty={{ title: 'No locations found', icon: <MapPinXInside /> }}
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
          onDelete: removeItems,
        }}
      />
      <UpsertLocation.Viewport />
    </>
  );
}
