'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Table, Text } from '@chakra-ui/react';
import { BookUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';

import { Tooltip } from '@/components/ui/tooltip';
import { InsertTestResult } from '@/drizzle/schema';
import { TestConfigurationSelection } from '@/features/periodic-testing/schemas/models';

const removalStyle = {
  cursor: 'pointer',
  textDecoration: 'line-through',
  textDecorationColor: 'red.500',
};

export default function TestResultTable({
  configuration,
  setSelection,
  onChange,
}: {
  configuration: TestConfigurationSelection;
  setSelection: React.Dispatch<
    React.SetStateAction<TestConfigurationSelection>
  >;
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

  const handlePageChange = useCallback(({ page }: { page: number }) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

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

  // Generate a unique key for each player-test combination
  const getResultKey = (user_id: string, type_id: string) =>
    `${user_id}-${type_id}`;

  return (
    <>
      <Table.ScrollArea>
        <Table.Root size="sm" showColumnBorder>
          {hasData && (
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Player Name</Table.ColumnHeader>
                {configuration.types.map(({ type_id, name, unit }) => (
                  <Tooltip
                    key={type_id}
                    showArrow
                    content={`Remove "${name}" ?`}
                    positioning={{ placement: 'top-start' }}
                  >
                    <Table.ColumnHeader
                      _hover={removalStyle}
                      onClick={() =>
                        setSelection((prev) => ({
                          ...prev,
                          types: prev.types.filter(
                            (type) => type.type_id !== type_id
                          ),
                        }))
                      }
                    >
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
                  </Tooltip>
                ))}
              </Table.Row>
            </Table.Header>
          )}
          <Table.Body>
            {hasData ? (
              configuration.players.map(({ user_id, name }) => (
                <Table.Row key={user_id}>
                  <Tooltip
                    key={user_id}
                    showArrow
                    content={`Remove "${name}" ?`}
                    positioning={{ placement: 'top-start' }}
                  >
                    <Table.Cell
                      _hover={removalStyle}
                      onClick={() =>
                        setSelection((prev) => ({
                          ...prev,
                          players: prev.players.filter(
                            (player) => player.user_id !== user_id
                          ),
                        }))
                      }
                    >
                      {name}
                    </Table.Cell>
                  </Tooltip>
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
        onPageChange={handlePageChange}
      />
    </>
  );
}
