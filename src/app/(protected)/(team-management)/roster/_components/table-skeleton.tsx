'use client';

import { Flex, Skeleton, Table } from '@chakra-ui/react';

export default function RosterTableSkeleton() {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader width={6}>
            <Skeleton height={5} width={6} />
          </Table.ColumnHeader>
          <Table.ColumnHeader>No.</Table.ColumnHeader>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Email</Table.ColumnHeader>
          <Table.ColumnHeader>State</Table.ColumnHeader>
          <Table.ColumnHeader>Roles</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      {/* Table body */}
      <Table.Body>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Skeleton height={5} width={6} />
              </Table.Cell>
              <Table.Cell>
                <Skeleton height={5} width="1/2" />
              </Table.Cell>
              <Table.Cell>
                <Skeleton height={5} width="2xs" />
              </Table.Cell>
              <Table.Cell>
                <Skeleton height={5} width="2xs" />
              </Table.Cell>
              <Table.Cell>
                <Skeleton height={5} width="20" borderRadius="full" />
              </Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
                  <Skeleton height={5} width="20" borderRadius="full" />
                  <Skeleton height={5} width="20" borderRadius="full" />
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
      </Table.Body>
    </Table.Root>
  );
}
