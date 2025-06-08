import { Asset } from '@/drizzle/schema';
import { colorCondition } from '@/utils/helper';
import { Badge, Table } from '@chakra-ui/react';

export default function CategoryTable({ items }: { items: Array<Asset> }) {
  return (
    <Table.Root borderWidth="1px" size={{ base: 'sm', md: 'md' }}>
      <Table.Header>
        <Table.Row bg="bg.subtle">
          <Table.ColumnHeader>Item</Table.ColumnHeader>
          <Table.ColumnHeader>Quantity</Table.ColumnHeader>
          <Table.ColumnHeader>Condition</Table.ColumnHeader>
          <Table.ColumnHeader>Last Updated</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.name}>
            {/* need to replace with asset_id later */}
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
            <Table.Cell>-</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
