'use client';

import { useState } from 'react';

import { ActionBar, Badge, Button, Portal, Table } from '@chakra-ui/react';

import Pagination from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/visibility';

import { Asset } from '@/drizzle/schema/asset';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDate } from '@/utils/formatter';
import { colorCategory, colorCondition } from '@/utils/helper';

import { removeAsset } from '@/features/asset/actions/asset';
import { UpsertAsset } from './upsert-asset';

export default function AssetTable({ items }: { items: Array<Asset> }) {
  const { isAdmin, isGuest } = usePermissions();

  const [selection, setSelection] = useState<Array<string>>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
  });

  const totalCount = items.length;
  const selectionCount = selection.length;

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeAsset));
    const hasErrors = results.some(({ error }) => error);
    const successCount = results.filter((result) => !result.error).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      description: hasErrors
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
          interactive={items.length > 0}
        >
          <Table.Header>
            <Table.Row>
              <Visibility isVisible={isAdmin}>
                <Table.ColumnHeader width={6}>
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
                          : []
                      );
                    }}
                  />
                </Table.ColumnHeader>
              </Visibility>
              {[
                'Item',
                'Category',
                'Quantity',
                'Condition',
                'Last Updated',
                'Note',
              ].map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.length > 0 ? (
              items.map((item) => (
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
                  <Visibility isVisible={isAdmin}>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.asset_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.asset_id]
                              : selection.filter((id) => id !== item.asset_id)
                          );
                        }}
                      />
                    </Table.Cell>
                  </Visibility>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="outline"
                      borderRadius="full"
                      colorPalette={colorCategory(item.category)}
                    >
                      {item.category}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.quantity}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette={colorCondition(item.condition)}
                    >
                      {item.condition}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{formatDate(item.updated_at)}</Table.Cell>
                  <Table.Cell>{item.note}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={isAdmin ? 7 : 6}>
                  <EmptyState title="No items found" />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={items.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      />

      <ActionBar.Root open={hasSelection}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <ActionBar.SelectionTrigger>
                {selectionCount} selected
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={removeItems}
              >
                Delete
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </>
  );
}
