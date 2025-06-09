import { Badge, Table } from '@chakra-ui/react';
import { Box } from 'lucide-react';

import { Asset } from '@/drizzle/schema';
import { colorCondition } from '@/utils/helper';

import { EmptyState } from '@/components/ui/empty-state';
import { formatDatetime } from '@/utils/formatter';

export default function CategoryTable({ items }: { items: Array<Asset> }) {
  return (
    <Table.Root borderWidth={1} size={{ base: 'sm', md: 'md' }}>
      <Table.Header>
        <Table.Row backgroundColor="bg.subtle">
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
            <Table.Row key={item.asset_id}>
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
              <Table.Cell>{formatDatetime(item.updated_at)}</Table.Cell>
              <Table.Cell>{item.note}</Table.Cell>
            </Table.Row>
          ))
        ) : (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <EmptyState icon={<Box />} title="No items found" />
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Root>
  );
}
