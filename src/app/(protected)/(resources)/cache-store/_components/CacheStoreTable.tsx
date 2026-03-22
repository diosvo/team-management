'use client';

import { Table } from '@chakra-ui/react';
import { useSWRConfig } from 'swr';

import { EmptyState } from '@/components/ui/empty-state';

import { Cylinder } from 'lucide-react';

export default function CacheStoreTable() {
  const { cache } = useSWRConfig();

  const data = Array.from(
    (cache as Map<string, { data: Array<unknown> }>).entries(),
  ).map(([key, value]) => ({
    cache_key: key,
    data_length: value.data ? JSON.stringify(value.data.length) : 0,
  }));

  return (
    <Table.ScrollArea>
      <Table.Root borderWidth={1} size={{ base: 'sm', md: 'md' }} marginTop={6}>
        <Table.Caption marginTop={6}>
          Total cached keys: {data.length}
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            {['Entity', 'Data Length'].map((header) => (
              <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.length > 0 ? (
            data.map(({ cache_key, data_length }) => (
              <Table.Row key={cache_key}>
                <Table.Cell>{cache_key}</Table.Cell>
                <Table.Cell>{data_length}</Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan={2}>
                <EmptyState title="No cached data" icon={<Cylinder />} />
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
