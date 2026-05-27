'use client';

import { useCallback } from 'react';

import { Badge, Table } from '@chakra-ui/react';
import { isEqual } from 'es-toolkit/predicate';
import { capitalize } from 'es-toolkit/string';

import Authorized from '@/components/Authorized';
import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useFilteredPagination from '@/hooks/use-table-state';

import { ALL } from '@/utils/constant';
import { useAssetFilters } from '@/utils/filters';
import { formatDate, formatDatetime } from '@/utils/formatter';
import { colorCategory, colorCondition } from '@/utils/helper';

import { removeAsset } from '@/actions/asset';
import { Asset } from '@/drizzle/schema/asset';

import { UpsertAsset } from './UpsertAsset';

const HEADERS = [
  'Name',
  'Category',
  'Quantity',
  'Condition',
  'Assigned To',
  'Acquired Date',
  'Last Updated',
  'Note',
] as const;

export default function AssetTable({ data }: { data: Array<Asset> }) {
  const { isGuest } = usePermissions();
  const [{ q, page, category, condition }, setSearchParams] = useAssetFilters();

  const predicate = useCallback(
    (item: Asset) =>
      item.name.toLowerCase().includes(q.toLowerCase()) &&
      (isEqual(category, ALL.value) || isEqual(item.category, category)) &&
      (isEqual(condition, ALL.value) || isEqual(item.condition, condition)),
    [q, category, condition],
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
  } = useFilteredPagination(data, predicate, page, {
    headerCount: HEADERS.length,
  });

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
              <Authorized resource="assets" action="delete">
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
                          ? items.map(({ asset_id }) => asset_id)
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
                  key={item.asset_id}
                  _hover={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (isGuest) return;
                    UpsertAsset.open('update-asset', {
                      action: 'Update',
                      item,
                    });
                  }}
                >
                  <Authorized resource="assets" action="delete">
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.asset_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.asset_id]
                              : selection.filter((id) => id !== item.asset_id),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Authorized>
                  <Table.Cell>
                    <HighlightText query={q}>{item.name}</HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={colorCategory(item.category)}
                    >
                      {capitalize(item.category)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.quantity}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="outline"
                      borderRadius="full"
                      colorPalette={colorCondition(item.condition)}
                    >
                      {capitalize(item.condition)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.user?.name || '-'}</Table.Cell>
                  <Table.Cell>{formatDate(item.acquired_date)}</Table.Cell>
                  <Table.Cell>{formatDatetime(item.updated_at)}</Table.Cell>
                  <Table.Cell>{item.note}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState title="No assets found" />
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
      <UpsertAsset.Viewport />
    </>
  );
}
