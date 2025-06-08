import { Table } from '@chakra-ui/react';

export default function CategoryTable() {
  return (
    <Table.Root borderWidth="1px" size={{ base: 'sm', md: 'lg' }}>
      <Table.Header>
        <Table.Row bg="bg.subtle">
          <Table.ColumnHeader>Item</Table.ColumnHeader>
          <Table.ColumnHeader>Quantity</Table.ColumnHeader>
          <Table.ColumnHeader>Condition</Table.ColumnHeader>
          <Table.ColumnHeader>Last Checked</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>{item.name}</Table.Cell>
            <Table.Cell>{item.category}</Table.Cell>
            <Table.Cell>{item.price}</Table.Cell>
            <Table.Cell>-</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

const items = [
  { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99 },
  { id: 2, name: 'Coffee Maker', category: 'Home Appliances', price: 49.99 },
  { id: 3, name: 'Desk Chair', category: 'Furniture', price: 150.0 },
  { id: 4, name: 'Smartphone', category: 'Electronics', price: 799.99 },
  { id: 5, name: 'Headphones', category: 'Accessories', price: 199.99 },
];
