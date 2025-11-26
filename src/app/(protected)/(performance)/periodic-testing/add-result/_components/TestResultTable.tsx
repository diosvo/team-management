'use client';

import { useEffect, useState } from 'react';

import { Table, Text } from '@chakra-ui/react';
import { BookUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { Tooltip } from '@/components/ui/tooltip';

import { TestConfigurationSelection } from '@/types/periodic-testing';
import { useCommonParams } from '@/utils/filters';

import { InsertTestResult } from '@/drizzle/schema';

const removalStyle = {
  cursor: 'pointer',
  textDecoration: 'line-through',
  textDecorationColor: 'red.500',
};

export default function TestResultTable({
  configuration: { players, types, date },
  setSelection,
  onChange,
}: {
  configuration: TestConfigurationSelection;
  setSelection: React.Dispatch<
    React.SetStateAction<TestConfigurationSelection>
  >;
  onChange: (data: Array<InsertTestResult>) => void;
}) {
  const [{ page }, setSearchParams] = useCommonParams();
  const [results, setResults] = useState<Record<string, string>>({});

  const hasData = players.length > 0 && types.length > 0;

  useEffect(() => {
    if (!hasData) {
      onChange([]);
      return;
    }

    const formattedData: Array<InsertTestResult> = [];

    players.forEach(({ id }) => {
      types.forEach(({ type_id }) => {
        const key = getResultKey(id, type_id);
        const result = results[key] || '0';

        formattedData.push({
          type_id: type_id,
          player_id: id,
          result: result,
          date,
        });
      });
    });

    onChange(formattedData);
  }, [hasData, results]);

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
                {types.map(({ type_id, name, unit }) => (
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
              players.map(({ id, name }) => (
                <Table.Row key={id}>
                  <Tooltip
                    key={id}
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
                            (player) => player.id !== id
                          ),
                        }))
                      }
                    >
                      {name}
                    </Table.Cell>
                  </Tooltip>
                  {types.map(({ type_id }) => {
                    const key = getResultKey(id, type_id);
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
                <Table.Cell colSpan={types.length + 1}>
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
        count={players.length}
        page={page}
        pageSize={10}
        onPageChange={setSearchParams}
      />
    </>
  );
}
