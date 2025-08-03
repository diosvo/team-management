'use client';

import { useEffect, useMemo, useState } from 'react';

import { Table, Text } from '@chakra-ui/react';
import { BookUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';

import { InsertTestResult, TestType, User } from '@/drizzle/schema';

export default function TestResultTable({
  configuration,
  onChange,
}: {
  configuration: {
    players: Array<User>;
    types: Array<TestType>;
    date: string;
  };
  onChange: (data: Array<InsertTestResult>) => void;
}) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
  });
  const [results, setResults] = useState<Record<string, string>>({});

  const hasData = useMemo(
    () => configuration.players.length > 0 && configuration.types.length > 0,
    [configuration.players, configuration.types]
  );

  // Generate a unique key for each player-test combination
  const getResultKey = (user_id: string, type_id: string) =>
    `${user_id}-${type_id}`;

  useEffect(() => {
    if (!hasData) {
      onChange([]);
      return;
    }

    const formattedData: Array<InsertTestResult> = [];

    configuration.players.forEach(({ user_id }) => {
      configuration.types.forEach(({ type_id }) => {
        const key = getResultKey(user_id, type_id);
        const result = results[key] || '0';

        formattedData.push({
          type_id: type_id,
          user_id: user_id,
          result: result,
          date: configuration.date,
        });
      });
    });

    onChange(formattedData);
  }, [results, configuration]);

  return (
    <>
      <Table.ScrollArea>
        <Table.Root size="sm" showColumnBorder>
          {hasData && (
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Player Name</Table.ColumnHeader>
                {configuration.types.map(({ type_id, name, unit }) => (
                  <Table.ColumnHeader key={type_id}>
                    {name}
                    <Text
                      as="span"
                      fontSize="xs"
                      color="GrayText"
                      marginLeft={1}
                    >
                      ({unit})
                    </Text>
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
          )}
          <Table.Body>
            {hasData ? (
              configuration.players.map(({ user_id, name }) => (
                <Table.Row key={user_id}>
                  <Table.Cell>{name}</Table.Cell>
                  {configuration.types.map(({ type_id }) => {
                    const key = getResultKey(user_id, type_id);
                    return (
                      <Table.Cell key={type_id}>
                        <NumberInputRoot
                          min={0}
                          value={results[key] || '0'}
                          onValueChange={({ value }) =>
                            setResults((prev) => ({
                              ...prev,
                              [key]: value,
                            }))
                          }
                        >
                          <NumberInputField />
                        </NumberInputRoot>
                      </Table.Cell>
                    );
                  })}
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
