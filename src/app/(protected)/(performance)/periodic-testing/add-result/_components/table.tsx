'use client';

import { useMemo, useState } from 'react';

import { Input, Table } from '@chakra-ui/react';
import { BookUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';

import { TestType, User } from '@/drizzle/schema';

export default function TestResultTable({
  configuration,
}: {
  configuration: {
    players: Array<User>;
    types: Array<TestType>;
    date: string;
  };
}) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
  });
  const hasData = useMemo(
    () => configuration.players.length > 0 && configuration.types.length > 0,
    [configuration.players, configuration.types]
  );

  return (
    <>
      <Table.ScrollArea>
        <Table.Root size="sm" showColumnBorder>
          {hasData && (
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Player Name</Table.ColumnHeader>
                {configuration.types.map(({ type_id, name }) => (
                  <Table.ColumnHeader key={type_id}>{name}</Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
          )}
          <Table.Body>
            {hasData ? (
              configuration.players.map(({ user_id, name }) => (
                <Table.Row key={user_id}>
                  <Table.Cell>{name}</Table.Cell>
                  {configuration.types.map(({ type_id }) => (
                    <Table.Cell key={type_id}>
                      <Input variant="subtle" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={configuration.types.length + 1}>
                  <EmptyState
                    icon={<BookUser />}
                    title="No configuration set."
                    description="Please select all required fields to create players' result."
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={configuration.players.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      />
    </>
  );
}
