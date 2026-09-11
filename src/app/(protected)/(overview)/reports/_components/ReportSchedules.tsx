'use client';

import { useMemo, useState, useTransition } from 'react';

import { Badge, Box, Button, HStack } from '@chakra-ui/react';
import { CalendarClock, Play, Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import DataTable, { type Column } from '@/components/DataTable';
import PageTitle from '@/components/PageTitle';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import {
  INTERVAL_LABEL,
  INTERVAL_SELECTION,
  WEEKDAY_LABEL,
} from '@/utils/constants';
import { ReportFrequency } from '@/utils/enum';
import { formatDatetime } from '@/utils/formatter';
import { IntervalValues } from '@/types/common';

import {
  removeReportSchedules,
  runReportNow,
  toggleReportSchedule,
} from '@/actions/report';
import { ReportSchedule } from '@/drizzle/schema';

import {
  UPSERT_SCHEDULE_ID,
  UpsertReportSchedule,
} from './UpsertReportSchedule';

/** e.g. "Weekly · Monday", "Monthly · Day 5" or "Quarterly · Day 5". */
function cadenceLabel(item: ReportSchedule): string {
  switch (item.frequency) {
    case ReportFrequency.WEEKLY:
      return `Weekly · ${WEEKDAY_LABEL.get(item.day_of_week ?? 1)}`;
    case ReportFrequency.QUARTERLY:
      return `Quarterly · Day ${item.day_of_month ?? 1}`;
    default:
      return `Monthly · Day ${item.day_of_month ?? 1}`;
  }
}

export default function ReportSchedules({
  schedules,
}: {
  schedules: Array<ReportSchedule>;
}) {
  const { can } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useState<Array<string>>([]);

  const usedIntervals = useMemo<Array<IntervalValues>>(
    () => schedules.map(({ interval }) => interval),
    [schedules],
  );
  const allScheduled = usedIntervals.length >= INTERVAL_SELECTION.length;

  const toggle = (schedule_id: string, enabled: boolean) => {
    startTransition(async () => {
      const { success, message } = await toggleReportSchedule(
        schedule_id,
        enabled,
      );
      toaster.create({ type: success ? 'success' : 'error', title: message });
    });
  };

  const generateNow = (schedule_id: string) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Generating report...',
    });
    startTransition(async () => {
      const { success, message } = await runReportNow(schedule_id);
      toaster.update(id, {
        type: success ? 'success' : 'error',
        title: message,
      });
    });
  };

  const removeItems = () => {
    const id = toaster.create({
      type: 'loading',
      title: 'Deleting schedules...',
    });
    startTransition(async () => {
      const { success, message } = await removeReportSchedules(selection);

      toaster.update(id, { type: success ? 'success' : 'error', title: message });
      setSelection([]);
    });
  };

  const columns: Array<Column<ReportSchedule>> = [
    {
      header: 'Time Duration',
      cell: (item) => INTERVAL_LABEL.get(item.interval) ?? item.interval,
    },
    {
      header: 'Schedule',
      cell: (item) => cadenceLabel(item),
    },
    {
      header: 'Recipients',
      cell: (item) => `${item.recipients.length} recipient(s)`,
    },
    {
      header: 'Next Run',
      cell: (item) => (item.enabled ? formatDatetime(item.next_run_at) : '-'),
    },
    {
      header: 'Last Run',
      cell: (item) => formatDatetime(item.last_run_at),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (item) => (
        <Box onClick={(event) => event.stopPropagation()} width="fit-content">
          <Switch
            size="sm"
            checked={item.enabled}
            disabled={isPending || !can('reports', 'edit')}
            onCheckedChange={({ checked }) =>
              toggle(item.schedule_id, checked)
            }
          />
        </Box>
      ),
    },
    {
      header: '',
      align: 'right',
      cell: (item) => (
        <Authorized resource="reports" action={['create', 'edit']} mode="any">
          <Button
            size="xs"
            variant="outline"
            disabled={isPending || !item.enabled}
            onClick={(event) => {
              event.stopPropagation();
              generateNow(item.schedule_id);
            }}
          >
            <Play /> Run now
          </Button>
        </Authorized>
      ),
    },
  ];

  return (
    <>
      <HStack justifyContent="space-between">
        <PageTitle title="Report Schedules" />
        <Authorized resource="reports" action="create">
          <Button
            size={{ base: 'sm', md: 'md' }}
            disabled={allScheduled}
            title={
              allScheduled ? 'Every time duration is already scheduled' : undefined
            }
            onClick={() =>
              UpsertReportSchedule.open(UPSERT_SCHEDULE_ID, {
                action: 'Add',
                item: { schedule_id: '' },
                usedIntervals,
              })
            }
          >
            <Plus />
            New Schedule
          </Button>
        </Authorized>
      </HStack>

      <DataTable
        columns={columns}
        rowId={(item) => item.schedule_id}
        currentData={schedules}
        totalCount={schedules.length}
        page={1}
        onPageChange={() => {}}
        empty={{
          title: 'No report schedules yet',
          description: 'Create a schedule to email analytics reports automatically.',
          icon: <CalendarClock />,
        }}
        onRowClick={
          can('reports', 'edit')
            ? (item) =>
                UpsertReportSchedule.open(UPSERT_SCHEDULE_ID, {
                  action: 'Update',
                  item,
                  usedIntervals,
                })
            : undefined
        }
        selection={{
          canSelect: can('reports', 'delete'),
          items: schedules,
          selection,
          setSelection,
          disabled: isPending,
          onDelete: removeItems,
        }}
      />
      <UpsertReportSchedule.Viewport />
    </>
  );
}
