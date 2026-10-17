'use client';

import { useMemo } from 'react';

import { Badge, Button } from '@chakra-ui/react';
import {
  ClockAlert,
  ClockCheck,
  PanelLeftClose,
  UsersRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

import { enumLabel } from '@/i18n/enums';
import { useAttendanceFilters } from '@/lib/nuqs';
import { formatDate, formatDatetime } from '@/utils/datetime';
import { AttendanceStatus } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { removeAttendance, updateStatus } from '@/actions/attendance';
import type { AttendanceWithPlayer } from '@/types/attendance';

const ACTIONS = [
  {
    value: AttendanceStatus.ON_TIME,
    icon: ClockCheck,
    color: 'green',
  },
  {
    value: AttendanceStatus.LATE,
    icon: ClockAlert,
    color: 'yellow',
  },
  {
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
  const t = useTranslations('attendance.table');
  const tEnums = useTranslations('enums');
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
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(attendances, predicate, page);

  const updateItems = async (newStatus: AttendanceStatus) => {
    const results = await Promise.all(
      selection.map((attendance_id) => updateStatus(attendance_id, newStatus)),
    );
    const successCount = results.filter(({ success }) => success).length;
    const hasErrors = results.some(({ success }) => !success);

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? t('updateFailed', { count: selection.length - successCount })
        : t('updateSuccess', { count: successCount }),
    });

    if (!hasErrors) {
      setSelection([]);
      setSearchParams({ status: [newStatus], page: 1 });
    }
  };

  const columns: Array<Column<AttendanceWithPlayer>> = [
    // The window can span several days, so each row names its own.
    { header: t('date'), cell: (item) => formatDate(item.date) },
    {
      header: t('name'),
      cell: (item) => (
        <HighlightText query={q}>{item.player.user.name}</HighlightText>
      ),
    },
    {
      header: t('status'),
      cell: (item) => (
        <Badge
          size="sm"
          variant="surface"
          borderRadius="full"
          colorPalette={getColor(item.status)}
        >
          {enumLabel(tEnums, 'attendanceStatus', item.status)}
        </Badge>
      ),
    },
    { header: t('reason'), cell: (item) => item.reason },
    {
      header: t('lastUpdated'),
      cell: (item) => formatDatetime(item.updated_at),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rowId={(item) => item.attendance_id}
      currentData={currentData}
      totalCount={totalCount}
      page={page}
      onPageChange={setSearchParams}
      empty={{ title: t('empty'), icon: <UsersRound /> }}
      selection={{
        canSelect: isAdmin,
        items,
        selection,
        setSelection,
        disabled: isPending,
        onDelete: () => removeSelected(removeAttendance, 'attendance record'),
        actions: ACTIONS.map(({ value, icon: Icon, color }) => (
          <Visibility key={value} isVisible={!status.includes(value)}>
            <Button
              size="sm"
              variant="outline"
              colorPalette={color}
              onClick={() => updateItems(value)}
            >
              <Icon />
              {enumLabel(tEnums, 'attendanceStatus', value)}
            </Button>
          </Visibility>
        )),
      }}
    />
  );
}
