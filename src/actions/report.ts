'use server';

import { getTranslations } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import {
  deleteReportSchedules,
  fetchReportHistory,
  fetchReportRecipients,
  fetchReportSchedules,
  getReportSchedule,
  insertReportSchedule,
  updateReportSchedule,
} from '@/db/report';
import { getDbErrorMessage } from '@/db/pg-error';
import { UpsertReportScheduleValues } from '@/schemas/report';
import { computeNextRun, executeSchedule } from '@/lib/report-schedule';
import { requestOrigin } from '@/lib/request';
import { sendEmail, type EmailProps } from '@/lib/resend';
import { ReportTrigger } from '@/utils/enum';
import { ResponseFactory } from '@/utils/response';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const reports = withResource('reports');

export const getReportRecipients = withAuth(async ({ team_id }) => {
  if (!team_id) return [];
  return await fetchReportRecipients(team_id);
});

export const sendReportEmail = withAuth(
  async (_user, payload: EmailProps) => await sendEmail(payload),
);

export const getReportSchedules = reports(
  'view',
  async (user) => await fetchReportSchedules(user.team_id),
);

export const getReportHistory = reports(
  'view',
  async (user) => await fetchReportHistory(user.team_id),
);

export const upsertReportSchedule = reports(
  ['create', 'edit'],
  async function upsert(
    user,
    schedule_id: string,
    input: UpsertReportScheduleValues,
  ) {
    const t = await getTranslations('actions.report');
    // `next_run_at` is recomputed on every save so it always matches the
    // chosen window's cadence.
    const values = {
      ...input,
      team_id: user.team_id,
      next_run_at: computeNextRun(input.interval, new Date()),
    };

    try {
      if (schedule_id) {
        await updateReportSchedule(user.team_id, schedule_id, values);
      } else {
        await insertReportSchedule(values);
      }

      revalidate.reports();

      return ResponseFactory.success(
        t(schedule_id ? 'scheduleUpdated' : 'scheduleAdded'),
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const toggleReportSchedule = reports(
  ['edit'],
  async function toggle(user, schedule_id: string, enabled: boolean) {
    const t = await getTranslations('actions.report');
    try {
      // Re-enabling recomputes `next_run_at` from now, so a schedule that was
      // paused past its occurrence never fires a backlog of missed runs.
      let next_run_at: Date | undefined;
      if (enabled) {
        const schedule = await getReportSchedule(user.team_id, schedule_id);
        if (schedule)
          next_run_at = computeNextRun(schedule.interval, new Date());
      }

      await updateReportSchedule(user.team_id, schedule_id, {
        enabled,
        next_run_at,
      });

      revalidate.reports();

      return ResponseFactory.success(
        t(enabled ? 'scheduleEnabled' : 'scheduleDisabled'),
      );
    } catch {
      return ResponseFactory.error(t('scheduleUpdateFailed'));
    }
  },
);

export const removeReportSchedules = reports(
  ['delete'],
  async function remove(user, schedule_ids: Array<string>) {
    const t = await getTranslations('actions.report');
    try {
      await deleteReportSchedules(user.team_id, schedule_ids);

      revalidate.reports();

      return ResponseFactory.success(
        t('schedulesDeleted', { count: schedule_ids.length }),
      );
    } catch {
      return ResponseFactory.error(t('schedulesDeleteFailed'));
    }
  },
);

/**
 * Generate a report immediately for a schedule, rendering under the current
 * user's session so it works without the service account. `scheduled_for` is
 * `now()`, giving it a distinct idempotency key from the planned occurrence —
 * this is also the human recovery path after a failed scheduled run.
 */
export const runReportNow = reports(
  ['create', 'edit'],
  async function run(user, schedule_id: string) {
    const t = await getTranslations('actions.report');
    const schedule = await getReportSchedule(user.team_id, schedule_id);

    if (!schedule) {
      return ResponseFactory.error(t('scheduleNotFound'));
    }

    const request = requestOrigin(await headers());

    if (!request) {
      return ResponseFactory.error(t('unknownOrigin'));
    }

    const cookieStore = await cookies();

    const result = await executeSchedule({
      schedule,
      scheduled_for: new Date(),
      trigger: ReportTrigger.MANUAL,
      ...request,
      cookies: cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      session_team_id: user.team_id,
    });

    revalidate.reports();

    return result.outcome === 'sent'
      ? ResponseFactory.success(t('generated'))
      : ResponseFactory.error(result.error ?? t('generateFailed'));
  },
);
