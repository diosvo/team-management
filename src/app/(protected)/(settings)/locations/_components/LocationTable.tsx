'use client';

import { useCallback } from 'react';

import { Table } from '@chakra-ui/react';
import { MapPinXInside } from 'lucide-react';

import Authorized from '@/components/Authorized';
import { LocationLink } from '@/components/common/LocationSelection';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';

import { removeLocation } from '@/actions/location';
import { Location } from '@/drizzle/schema';

import { UpsertLocation } from './UpsertLocation';

const HEADERS = ['Name', 'Address', 'Last Updated'] as const;

export default function LocationTable({
  locations,
}: {
  locations: Array<Location>;
}) {
  const { isGuest } = usePermissions();
  const [{ q, page }, setSearchParams] = useCommonParams();

  const predicate = useCallback(
    (item: Location) => {
      const query = q.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query)
      );
    },
    [q],
  );
  const {
    items,
    currentData,
    indeterminate,
    selection,
    setSelection,
    hasSelection,
    totalCount,
    columnCount,
    selectionCount,
  } = useTableState(locations, predicate, page, {
    headerCount: HEADERS.length,
  });

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

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={totalCount > 0}
        >
          <Table.Header>
            <Table.Row>
              <Authorized resource="locations" action="delete">
                <Table.ColumnHeader width={4}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) => {
                      setSelection(
                        changes.checked
                          ? items.map(({ location_id }) => location_id)
                          : [],
                      );
                    }}
                  />
                </Table.ColumnHeader>
              </Authorized>
              {HEADERS.map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row
                  key={item.location_id}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    UpsertLocation.open('update-location', {
                      action: 'Update',
                      item,
                    });
                  }}
                >
                  <Authorized resource="locations" action="delete">
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.location_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.location_id]
                              : selection.filter(
                                  (id) => id !== item.location_id,
                                ),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <LocationLink name={item.name}>
                      <HighlightText query={q}>{item.name}</HighlightText>
                    </LocationLink>
                  </Table.Cell>
                  <Table.Cell>
                    <HighlightText query={q}>{item.address}</HighlightText>
                  </Table.Cell>
                  <Table.Cell>{formatDatetime(item.updated_at)}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState
                    title="No locations found"
                    icon={<MapPinXInside />}
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
        onPageChange={setSearchParams}
      />
      <SelectionActionBar
        open={hasSelection}
        selectionCount={selectionCount}
        onDelete={removeItems}
      />
      <UpsertLocation.Viewport />
    </>
  );
}
