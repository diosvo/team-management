'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';

import { Button, Flex, Table, Text } from '@chakra-ui/react';
import { FileUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import {
  PopoverArrow,
  PopoverBody,
  PopoverCloseTrigger,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/use-permissions';

import { updateTestResultById } from '@/actions/test-result';
import { TestResult } from '@/schemas/models';

type Cell = {
  playerId: string;
  resultId: string;
  currentScore: string;
  newScore: string;
};

export default function PlayerPerformanceMatrix({
  result,
}: {
  result: TestResult;
}) {
  const { isGuest, isPlayer } = usePermissions();
  const viewOnly = useMemo(() => isGuest || isPlayer, [isGuest, isPlayer]);

  const [isPending, startTransition] = useTransition();
  const [openPopoverKey, setOpenPopoverKey] = useState<Nullable<string>>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });
  const [editingCell, setEditingCell] = useState<Cell>({
    playerId: '',
    resultId: '',
    currentScore: '0',
    newScore: '0',
  });

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePageChange = useCallback(({ page }: { page: number }) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  // Calculate the players to show for the current page
  const currentData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = Math.min(
      startIndex + pagination.pageSize,
      result.players.length
    );

    return result.players.slice(startIndex, endIndex);
  }, [result.players, pagination]);

  const onScoreUpdate = (cell: Cell) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Updating score...',
    });

    startTransition(async () => {
      const { success, message: title } = await updateTestResultById({
        result_id: cell.resultId,
        player_id: cell.playerId,
        result: cell.newScore,
      });

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) setOpenPopoverKey(null);
    });
  };

  return (
    <>
      <Table.ScrollArea>
        <Table.Root size={{ base: 'sm', md: 'md' }} showColumnBorder>
          {result.players.length > 0 && (
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
              currentData.map(
                ({ player_id, player_name, tests, result_id }) => (
                  <Table.Row key={player_id}>
                    <Table.Cell>{player_name}</Table.Cell>
                    {result.headers.map(({ name }) => {
                      const popoverKey = `${player_id}-${name}`;
                      return (
                        <Table.Cell
                          key={name}
                          textAlign="center"
                          _hover={{
                            cursor: viewOnly ? 'default' : 'pointer',
                            backgroundColor: viewOnly ? 'default' : 'gray.100',
                          }}
                          onClick={() => {
                            if (viewOnly) return;
                            setOpenPopoverKey(popoverKey);
                            setEditingCell({
                              playerId: player_id,
                              resultId: result_id,
                              currentScore: tests[name] || '0',
                              newScore: tests[name] || '0',
                            });
                          }}
                        >
                          <PopoverRoot
                            open={openPopoverKey === popoverKey}
                            size="xs"
                            lazyMount
                            unmountOnExit
                            onOpenChange={({ open }) => {
                              if (!open) setOpenPopoverKey(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Text>{parseFloat(tests[name]) || '-'}</Text>
                            </PopoverTrigger>
                            <PopoverContent>
                              <PopoverArrow />
                              <PopoverCloseTrigger />
                              <PopoverBody>
                                <PopoverTitle>New score:</PopoverTitle>
                                <NumberInputRoot
                                  min={0}
                                  defaultValue={editingCell.currentScore}
                                  marginBlock={3}
                                  onValueChange={({ value }) => {
                                    setEditingCell((prev) => ({
                                      ...prev,
                                      newScore: value,
                                    }));
                                  }}
                                >
                                  <NumberInputField />
                                </NumberInputRoot>
                                <Flex justifyContent="flex-end">
                                  <Button
                                    disabled={
                                      parseFloat(editingCell.currentScore) ===
                                        parseFloat(editingCell.newScore) ||
                                      editingCell.newScore === '' ||
                                      isPending
                                    }
                                    onClick={() => onScoreUpdate(editingCell)}
                                  >
                                    Save
                                  </Button>
                                </Flex>
                              </PopoverBody>
                            </PopoverContent>
                          </PopoverRoot>
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                )
              )
            ) : (
              <Table.Row>
                <Table.Cell colSpan={result.headers.length + 1}>
                  <EmptyState icon={<FileUser />} title="No data found" />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={result.players.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
      />
    </>
  );
}
