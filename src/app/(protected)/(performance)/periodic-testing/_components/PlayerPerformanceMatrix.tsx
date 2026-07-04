'use client';

import { memo, useCallback, useMemo, useState, useTransition } from 'react';

import { Editable, Table, Text } from '@chakra-ui/react';
import { FileUser } from 'lucide-react';

import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import {
  createTestResult,
  deleteTestResultById,
  updateTestResultById,
} from '@/actions/test-result';
import { PlayerTestResult, TestResult } from '@/types/periodic-testing';
import { usePeriodicTestingFilters } from '@/utils/filters';

const PAGE_SIZE = 10;

const stickyColumn = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  backgroundColor: 'white',
} as const;

type MatrixCellProps = {
  resultId?: string;
  value: string;
  editable: boolean;
  // Identify the player/type/date so an empty cell can create a new result.
  playerId: string;
  typeId: string;
  date: string;
};

/**
 * A single editable score cell. Owns its own draft + transition so editing one
 * cell never re-renders the rest of the matrix.
 */
const MatrixCell = memo(function MatrixCell({
  resultId,
  value,
  editable,
  playerId,
  typeId,
  date,
}: MatrixCellProps) {
  const [score, setScore] = useState(value);
  const [committed, setCommitted] = useState(value);
  const [isPending, startTransition] = useTransition();

  // Adjust the draft during render when the server value changes (e.g.
  // revalidation) instead of in an effect — avoids a cascading re-render.
  if (value !== committed) {
    setCommitted(value);
    setScore(value);
  }

  const onCommit = (next: string) => {
    // No change — nothing to do.
    if (next === value) {
      setScore(value);
      return;
    }

    // Cleared: delete the saved result, or revert if the cell was empty.
    if (next === '') {
      if (!resultId) {
        setScore(value);
        return;
      }

      const id = toaster.create({
        type: 'loading',
        title: 'Deleting score...',
      });

      startTransition(async () => {
        const { success, message: title } =
          await deleteTestResultById(resultId);

        toaster.update(id, { type: success ? 'success' : 'error', title });

        // Revert the draft if the delete failed.
        if (!success) setScore(value);
      });
      return;
    }

    const id = toaster.create({ type: 'loading', title: 'Saving score...' });

    startTransition(async () => {
      const { success, message: title } = resultId
        ? await updateTestResultById({ result_id: resultId, result: next })
        : await createTestResult([
            { player_id: playerId, type_id: typeId, date, result: next },
          ]);

      toaster.update(id, { type: success ? 'success' : 'error', title });

      // Revert the draft if the save failed.
      if (!success) setScore(value);
    });
  };

  return (
    <Table.Cell textAlign="center" padding={0}>
      <Editable.Root
        value={score}
        placeholder="-"
        disabled={!editable || isPending}
        activationMode="click"
        textAlign="center"
        onValueChange={({ value }) => setScore(value)}
        onValueCommit={({ value }) => onCommit(value)}
      >
        <Editable.Preview
          width="full"
          minHeight={8}
          justifyContent="center"
          _hover={editable ? { backgroundColor: 'gray.100' } : undefined}
        />
        <Editable.Input type="number" min={0} textAlign="center" />
      </Editable.Root>
    </Table.Cell>
  );
});

function PlayerPerformanceMatrix({ result }: { result: TestResult }) {
  const [{ q, page, type, date }, setSearchParams] =
    usePeriodicTestingFilters();
  const { can } = usePermissions();
  // Drive editability off the actual ability so it matches the server actions
  // (covers SUPER_ADMIN, COACH, and Captain — not viewer roles).
  const editable = can('periodic-testing', 'edit');

  const predicate = useCallback(
    (player: PlayerTestResult) =>
      player.player_name.toLowerCase().includes(q.toLowerCase()),
    [q],
  );
  const { currentData, totalCount } = useTableState(
    result.players,
    predicate,
    page,
    { pageSize: PAGE_SIZE },
  );

  // Restrict columns to the selected test types (empty = show all).
  const headers = useMemo(
    () =>
      type.length === 0
        ? result.headers
        : result.headers.filter(({ name }) => type.includes(name)),
    [result.headers, type],
  );

  return (
    <>
      <Table.ScrollArea>
        <Table.Root size={{ base: 'sm', md: 'md' }} showColumnBorder>
          {totalCount > 0 && (
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader {...stickyColumn}>
                  Player
                </Table.ColumnHeader>
                {headers.map(({ name, unit }) => (
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
              currentData.map(({ player_id, player_name, tests }) => (
                <Table.Row key={player_id}>
                  <Table.Cell {...stickyColumn}>
                    <HighlightText query={q}>{player_name}</HighlightText>
                  </Table.Cell>
                  {headers.map(({ name, type_id }) => {
                    const cell = tests[name];
                    return (
                      <MatrixCell
                        key={name}
                        resultId={cell?.result_id}
                        value={cell?.result ?? ''}
                        editable={editable}
                        playerId={player_id}
                        typeId={type_id}
                        date={date}
                      />
                    );
                  })}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={headers.length + 1}>
                  <EmptyState
                    icon={<FileUser />}
                    title="No test result found"
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setSearchParams}
      />
    </>
  );
}

export default memo(PlayerPerformanceMatrix);
