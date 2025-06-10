'use client';

import { useState } from 'react';

import { ActionBar, Badge, Button, Portal, Table } from '@chakra-ui/react';
import { Box } from 'lucide-react';

import { Asset } from '@/drizzle/schema';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDate } from '@/utils/formatter';
import { colorCondition } from '@/utils/helper';

import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import Visibility from '@/components/visibility';

import { UpsertAsset } from './upsert-asset';

export default function CategoryTable({ items }: { items: Array<Asset> }) {
  const { isAdmin, isGuest } = usePermissions();

  const [selection, setSelection] = useState<Array<string>>([]);

  const totalCount = items.length;
  const selectionCount = selection.length;

  // Selection
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < totalCount;

  const removeItems = async () => {
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
              {['Item', 'Quantity', 'Condition', 'Last Updated', 'Note'].map(
                (header) => (
                  <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
                )
              )}
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
                <Table.Cell colSpan={isAdmin ? 5 : 4}>
                  <EmptyState icon={<Box />} title="No items found" />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

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
