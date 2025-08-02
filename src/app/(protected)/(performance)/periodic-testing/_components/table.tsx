'use client';

import { useMemo, useState, useTransition } from 'react';

import { Button, Flex, NumberInput, Table, Text } from '@chakra-ui/react';
import { FileUser } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/use-permissions';

import { updateTestResultById } from '@/features/periodic-testing/actions/test-result';
import { TestResult } from '@/features/periodic-testing/schemas/models';

interface Cell {
  userId: string;
  resultId: string;
  currentScore: string;
  newScore: string;
}

export default function TestResultTableProps({
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
    userId: '',
    resultId: '',
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

  const onScoreUpdate = (cell: Cell) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Updating score...',
    });

    startTransition(async () => {
      const { error, message: description } = await updateTestResultById({
        result_id: cell.resultId,
        user_id: cell.userId,
        result: cell.newScore,
      });

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) setOpenPopoverKey(null);
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
              currentData.map(({ user_id, player_name, tests, result_id }) => (
                <Table.Row key={user_id}>
                  <Table.Cell>{player_name}</Table.Cell>
                  {result.headers.map(({ name }) => {
                    const popoverKey = `${user_id}-${name}`;
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
                            userId: user_id,
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
                            <PopoverBody>
                              <PopoverTitle>New score:</PopoverTitle>
                              <NumberInput.Root
                                inputMode="decimal"
                                marginBlock={3}
                                defaultValue={editingCell.currentScore}
                                onValueChange={({ value }) => {
                                  setEditingCell((prev) => ({
                                    ...prev,
                                    newScore: value,
                                  }));
                                }}
                              >
                                <NumberInput.Control />
                                <NumberInput.Input />
                              </NumberInput.Root>
                              <Flex justifyContent="space-between">
                                <Button
                                  variant="subtle"
                                  onClick={() => setOpenPopoverKey(null)}
                                >
                                  Cancel
                                </Button>
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
    </>
  );
}
