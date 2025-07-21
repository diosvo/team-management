'use client';

import { useMemo, useState } from 'react';

import { Table, Text, VStack } from '@chakra-ui/react';
import { TrendingUp } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';

interface TestTypesOverviewProps {
  result: any;
  searchTerm?: string;
  onUpdateScore?: (
    playerName: string,
    testType: string,
    newScore: number
  ) => void;
}

export default function PerformanceMatrixTable({
  result,
  searchTerm = '',
  onUpdateScore,
}: TestTypesOverviewProps) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
  });

  const [editingCell, setEditingCell] = useState<{
    playerName: string;
    testType: string;
    currentScore: number;
    isOpen: boolean;
  } | null>(null);

  const [newScoreValue, setNewScoreValue] = useState('');

  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    return result.players.filter(({ player_name }) =>
      player_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [result, searchTerm]);

  // Calculate the players to show for the current page
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(
    startIndex + pagination.pageSize,
    filteredPlayers.length
  );
  const currentData = useMemo(
    () => filteredPlayers.slice(startIndex, endIndex),
    [filteredPlayers, startIndex, endIndex]
  );

  const handleScoreUpdate = () => {
    if (!editingCell || !newScoreValue || isNaN(Number(newScoreValue))) {
      return;
    }

    const scoreValue = Number(newScoreValue);

    if (onUpdateScore) {
      onUpdateScore(editingCell.playerName, editingCell.testType, scoreValue);
    } else {
      console.log(
        `Updating ${editingCell.playerName}'s ${editingCell.testType} from ${editingCell.currentScore} to ${scoreValue}`
      );
      alert('Score update functionality not connected to data source');
    }

    handleClosePopover();
  };

  const handleClosePopover = () => {
    setEditingCell(null);
    setNewScoreValue('');
  };

  return (
    <VStack align="stretch">
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          showColumnBorder
        >
          {filteredPlayers.length > 0 && (
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader
                  position="sticky"
                  left={0}
                  zIndex={1}
                  backgroundColor="white"
                >
                  Player
                </Table.ColumnHeader>

                {result.headers.map(({ name, unit }) => (
                  <Table.ColumnHeader key={name} textAlign="center">
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
            {currentData.length > 0 ? (
              currentData.map(({ user_id, player_name, tests }) => (
                <Table.Row key={user_id}>
                  <Table.Cell
                    position="sticky"
                    left={0}
                    zIndex={1}
                    backgroundColor="white"
                  >
                    {player_name}
                  </Table.Cell>

                  {result.headers.map(({ name }) => (
                    <Table.Cell key={`${user_id}-${name}`} textAlign="center">
                      {tests[name] || '-'}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={result.headers.length + 1}>
                  <EmptyState
                    icon={<TrendingUp />}
                    title="No test data available"
                    description="Try adjusting your search"
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={filteredPlayers.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      />
    </VStack>
  );
}
