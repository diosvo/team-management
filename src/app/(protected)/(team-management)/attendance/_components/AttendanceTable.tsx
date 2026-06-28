'use client';

import { useCallback } from 'react';

import { Badge, Button, Table } from '@chakra-ui/react';
import {
  ClockAlert,
  ClockCheck,
  PanelLeftClose,
  UsersRound,
} from 'lucide-react';

import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useAttendanceFilters } from '@/lib/nuqs';
import { AttendanceStatus } from '@/utils/enum';
import { formatDatetime } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeAttendance, updateStatus } from '@/actions/attendance';
import { AttendanceWithPlayer } from '@/types/attendance';

const HEADERS = ['Name', 'Status', 'Reason', 'Last Updated'] as const;

const ACTIONS = [
  {
    label: 'On Time',
    value: AttendanceStatus.ON_TIME,
    icon: ClockCheck,
    color: 'green',
  },
  {
    label: 'Late',
    value: AttendanceStatus.LATE,
    icon: ClockAlert,
    color: 'yellow',
  },
  {
    label: 'Absent',
    value: AttendanceStatus.ABSENT,
    icon: PanelLeftClose,
    color: 'orange',
  },
];

export default function AttendanceTable({
  attendances,
}: {
  attendances: Array<AttendanceWithPlayer>;
}) {
  const { isAdmin } = usePermissions();
  const [{ q, page, status }, setSearchParams] = useAttendanceFilters();

  const predicate = useCallback(
    (item: AttendanceWithPlayer) => {
      const matchesSearch = item.player.user.name
        .toLowerCase()
        .includes(q.toLowerCase());
      const matchesStatus = status.length === 0 || status.includes(item.status);

      return matchesSearch && matchesStatus;
    },
    [q, status],
  );

  const {
    items,
    currentData,
    indeterminate,
    selection,
    setSelection,
    hasSelection,
    totalCount,
    columnCount,
    selectionCount,
  } = useTableState(attendances, predicate, page, {
    headerCount: HEADERS.length,
  });

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeAttendance));
    const successCount = results.filter(({ success }) => success).length;
    const hasErrors = successCount < selectionCount;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Failed to delete ${selectionCount - successCount} attendance record(s)`
        : `Deleted ${successCount} attendance record(s) successfully`,
    });

    if (!hasErrors) setSelection([]);
  };

  const updateItems = async (newStatus: AttendanceStatus) => {
    const results = await Promise.all(
      selection.map((attendance_id) => updateStatus(attendance_id, newStatus)),
    );
    const successCount = results.filter(({ success }) => success).length;
    const hasErrors = results.some(({ success }) => !success);

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Failed to update ${selectionCount - successCount} attendance record(s)`
        : `Updated ${successCount} attendance record(s) successfully`,
    });

    if (!hasErrors) {
      setSelection([]);
      setSearchParams({ status: [newStatus], page: 1 });
    }
  };

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={totalCount > 0}
        >
          <Table.Header>
            <Table.Row>
              <Visibility isVisible={isAdmin}>
                <Table.ColumnHeader width={5}>
                  <Checkbox
                    top={0.5}
                    aria-label="Select all rows"
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) => {
                      setSelection(
                        changes.checked
                          ? items.map(({ attendance_id }) => attendance_id)
                          : [],
                      );
                    }}
                  />
                </Table.ColumnHeader>
              </Visibility>
              {HEADERS.map((header) => (
                <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <Table.Row key={item.attendance_id}>
                  <Visibility isVisible={isAdmin}>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        top={0.5}
                        aria-label="Select row"
                        checked={selection.includes(item.attendance_id)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, item.attendance_id]
                              : prev.filter((id) => id !== item.attendance_id),
                          );
                        }}
                      />
                    </Table.Cell>
                  </Visibility>
                  <Table.Cell>
                    <HighlightText query={q}>
                      {item.player.user.name}
                    </HighlightText>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="sm"
                      variant="outline"
                      borderRadius="full"
                      colorPalette={getColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.reason || '-'}</Table.Cell>
                  <Table.Cell>{formatDatetime(item.updated_at)}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columnCount}>
                  <EmptyState title="No players found" icon={<UsersRound />} />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={totalCount}
        page={page}
        onPageChange={setSearchParams}
      />
      <SelectionActionBar
        open={hasSelection}
        selectionCount={selectionCount}
        onDelete={removeItems}
      >
        {ACTIONS.map(({ label, value, icon: Icon, color }) => (
          <Visibility key={value} isVisible={!status.includes(value)}>
            <Button
              size="sm"
              variant="outline"
              colorPalette={color}
              onClick={() => updateItems(value)}
            >
              <Icon />
              {label}
            </Button>
          </Visibility>
        ))}
      </SelectionActionBar>
    </>
  );
}
