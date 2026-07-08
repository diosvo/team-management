'use client';

import { useMemo } from 'react';

import { Badge, Button } from '@chakra-ui/react';
import {
  ClockAlert,
  ClockCheck,
  PanelLeftClose,
  UsersRound,
} from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { useAttendanceFilters } from '@/lib/nuqs';
import { AttendanceStatus } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { removeAttendance, updateStatus } from '@/actions/attendance';
import { AttendanceWithPlayer } from '@/types/attendance';

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

  const predicate = useMemo(
    () =>
      buildPredicate<AttendanceWithPlayer>({
        search: { query: q, fields: [(item) => item.player.user.name] },
        match: { status },
      }),
    [q, status],
  );

  const {
    items,
    currentData,
    selection,
    setSelection,
    selectionCount,
    totalCount,
  } = useTableState(attendances, predicate, page);

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

  const columns: Array<Column<AttendanceWithPlayer>> = [
    {
      header: 'Name',
      cell: (item) => (
        <HighlightText query={q}>{item.player.user.name}</HighlightText>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <Badge
          size="sm"
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {item.status}
        </Badge>
      ),
    },
    { header: 'Reason', cell: (item) => item.reason },
    { header: 'Last Updated', cell: (item) => formatDatetime(item.updated_at) },
  ];

  return (
    <DataTable
      columns={columns}
      rowId={(item) => item.attendance_id}
      currentData={currentData}
      totalCount={totalCount}
      page={page}
      onPageChange={setSearchParams}
      empty={{ title: 'No players found', icon: <UsersRound /> }}
      selection={{
        canSelect: isAdmin,
        items,
        selection,
        setSelection,
        onDelete: removeItems,
        actions: ACTIONS.map(({ label, value, icon: Icon, color }) => (
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
        )),
      }}
    />
  );
}
