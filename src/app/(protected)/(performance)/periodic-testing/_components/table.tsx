'use client';

import { useMemo, useState, useTransition } from 'react';

import {
  Button,
  Flex,
  NumberInput,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FileUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
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
import { TestResult } from '@/features/periodic-testing/db/test-result';
import { usePermissions } from '@/hooks/use-permissions';

export default function TestResultTableProps({
  result,
}: {
  result: TestResult;
}) {
  const { isGuest, isPlayer } = usePermissions();
  const [isPending, startTransition] = useTransition();

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });
  const [editingCell, setEditingCell] = useState<{
    user_id: string;
    result_id: string;
    currentScore: string;
    newScore: string;
  }>({
    user_id: '',
    result_id: '',
    currentScore: '0',
    newScore: '0',
  });

  // Calculate the players to show for the current page
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(
    startIndex + pagination.pageSize,
    result.players.length
  );
  const currentData = useMemo(
    () => result.players.slice(startIndex, endIndex),
    [result.players, startIndex, endIndex]
  );

  console.log(result.players);

  const onScoreUpdate = (cell: {
    user_id: string;
    result_id: string;
    currentScore: string;
    newScore: string;
  }) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Updating test result...',
    });

    // TODO: Handle validation for newScore
    // startTransition(async () => {
    //   const { error, message: description } = await updateTestResultById({
    //     result_id: cell.result_id,
    //     user_id: cell.user_id,
    //     result: cell.newScore,
    //   });

    //   toaster.update(id, {
    //     type: error ? 'error' : 'success',
    //     description,
    //   });
    // });
  };

  return (
    <VStack align="stretch">
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
              currentData.map(({ user_id, player_name, tests, result_id }) => (
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
                    <PopoverRoot
                      key={`${user_id}-${name}`}
                      lazyMount
                      unmountOnExit
                    >
                      <PopoverTrigger width="full" asChild>
                        <Table.Cell
                          textAlign="center"
                          _hover={{
                            cursor: isGuest || isPlayer ? 'default' : 'pointer',
                            backgroundColor:
                              isGuest || isPlayer ? 'default' : 'gray.100',
                          }}
                          onClick={() => {
                            if (isGuest || isPlayer) return;
                            setEditingCell({
                              user_id,
                              result_id,
                              currentScore: tests[name] || '0',
                              newScore: '0',
                            });
                          }}
                        >
                          {tests[name] || '-'}
                        </Table.Cell>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverArrow />
                        <PopoverBody>
                          <PopoverCloseTrigger />
                          <PopoverTitle>New value:</PopoverTitle>
                          <NumberInput.Root
                            marginBlock={2}
                            value={editingCell.currentScore}
                            onValueChange={({ value }) =>
                              setEditingCell((prev) => ({
                                ...prev,
                                newScore: value,
                              }))
                            }
                          >
                            <NumberInput.Control />
                            <NumberInput.Input />
                          </NumberInput.Root>
                          <Flex justifyContent="flex-end">
                            <Button
                              disabled={
                                editingCell.currentScore ===
                                  editingCell.newScore || isPending
                              }
                              onClick={() => onScoreUpdate(editingCell)}
                            >
                              Save
                            </Button>
                          </Flex>
                        </PopoverBody>
                      </PopoverContent>
                    </PopoverRoot>
                  ))}
                </Table.Row>
              ))
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
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      />
    </VStack>
  );
}
