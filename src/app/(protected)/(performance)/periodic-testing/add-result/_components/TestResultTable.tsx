'use client';

import { memo, useCallback } from 'react';

import { Table, Text } from '@chakra-ui/react';
import { BookUser } from 'lucide-react';

import Pagination from '@/components/Pagination';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { Tooltip } from '@/components/ui/tooltip';

import { paginateData, useCommonParams } from '@/utils/filters';

import { TestConfigurationSelection } from '@/types/periodic-testing';

const PAGE_SIZE = 10;

const removalStyle = {
  cursor: 'pointer',
  textDecoration: 'line-through',
  textDecorationColor: 'red.500',
};

// Generate a unique key for each player-test combination.
const getResultKey = (player_id: string, type_id: string) =>
  `${player_id}-${type_id}`;

type ResultCellProps = {
  cellKey: string;
  value: string;
  onChange: (key: string, value: string) => void;
};

// Memoized so editing one cell doesn't re-render the entire grid.
const ResultCell = memo(function ResultCell({
  cellKey,
  value,
  onChange,
}: ResultCellProps) {
  return (
    <Table.Cell>
      <NumberInputRoot
        min={0}
        value={value}
        onValueChange={({ value }) => onChange(cellKey, value)}
      >
        <NumberInputField />
      </NumberInputRoot>
    </Table.Cell>
  );
});

export default function TestResultTable({
  configuration: { players, types },
  setSelection,
  results,
  setResults,
}: {
  configuration: TestConfigurationSelection;
  setSelection: React.Dispatch<
    React.SetStateAction<TestConfigurationSelection>
  >;
  results: Record<string, string>;
  setResults: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [{ page }, setSearchParams] = useCommonParams();

  const hasData = players.length > 0 && types.length > 0;
  const currentData = paginateData(players, page, PAGE_SIZE);

  const handleChange = useCallback(
    (key: string, value: string) =>
      setResults((prev) => ({ ...prev, [key]: value })),
    [setResults],
  );

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
                            (type) => type.type_id !== type_id,
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
              currentData.map(({ id, name }) => (
                <Table.Row key={id}>
                  <Tooltip
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
                            (player) => player.id !== id,
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
                      <ResultCell
                        key={type_id}
                        cellKey={key}
                        value={results[key] || '0'}
                        onChange={handleChange}
                      />
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
        pageSize={PAGE_SIZE}
        onPageChange={setSearchParams}
      />
    </>
  );
}
