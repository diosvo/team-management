'use client';

import { useMemo, useState, useTransition } from 'react';

import { Box, Button, HStack, VisuallyHidden } from '@chakra-ui/react';
import { CalendarClock, CalendarSync, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';
import DataTable, { type Column } from '@/components/DataTable';
import PageTitle from '@/components/PageTitle';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';
import { enumLabel } from '@/i18n/enums';
import { SCHEDULED_INTERVALS } from '@/utils/constants';
import { formatDatetime } from '@/utils/datetime';

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

export default function ReportSchedules({
  schedules,
}: {
  schedules: Array<ReportSchedule>;
}) {
  const t = useTranslations('reports.schedules');
  const tCommon = useTranslations('common');
  const tEnums = useTranslations('enums');
  const { can } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useState<Array<string>>([]);

  const usedIntervals = useMemo(
    () => schedules.map(({ interval }) => interval),
    [schedules],
  );
  const allScheduled = SCHEDULED_INTERVALS.every((interval) =>
    usedIntervals.includes(interval),
  );

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
      title: t('generating'),
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
      title: t('deleting'),
    });
    startTransition(async () => {
      const { success, message } = await removeReportSchedules(selection);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title: message,
      });
      setSelection([]);
    });
  };

  const columns: Array<Column<ReportSchedule>> = [
    {
      header: t('report'),
      cell: (item) => enumLabel(tEnums, 'scheduledInterval', item.interval),
    },
    {
      header: t('recipients'),
      cell: (item) => t('recipientCount', { count: item.recipients.length }),
    },
    {
      header: t('nextRun'),
      cell: (item) => (item.enabled ? formatDatetime(item.next_run_at) : '-'),
    },
    {
      header: t('lastRun'),
      cell: (item) => formatDatetime(item.last_run_at),
    },
    {
      header: tCommon('status'),
      align: 'center',
      cell: (item) => (
        <Box onClick={(event) => event.stopPropagation()}>
          <Switch
            size="sm"
            checked={item.enabled}
            disabled={isPending || !can('reports', 'edit')}
            onCheckedChange={({ checked }) => toggle(item.schedule_id, checked)}
          >
            <VisuallyHidden>{t('enable')}</VisuallyHidden>
          </Switch>
        </Box>
      ),
    },
    {
      header: <VisuallyHidden>{tCommon('actions')}</VisuallyHidden>,
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
            <Play /> {t('runNow')}
          </Button>
        </Authorized>
      ),
    },
  ];

  return (
    <>
      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title={t('title')} />
        <Authorized resource="reports" action="create">
          <Button
            disabled={allScheduled}
            title={allScheduled ? t('allScheduled') : undefined}
            onClick={() =>
              UpsertReportSchedule.open(UPSERT_SCHEDULE_ID, {
                action: 'Add',
                item: { schedule_id: '' },
                usedIntervals,
              })
            }
          >
            <CalendarSync />
            {t('newSchedule')}
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
          title: t('emptyTitle'),
          description: t('emptyDescription'),
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
