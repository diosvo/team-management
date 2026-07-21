'use server';

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
import { DEFAULT_TIMEZONE } from '@/utils/constants';
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
    // The schema already normalized the cadence (only the day matching the
    // frequency survives); recomputing `next_run_at` on every save keeps it
    // consistent when the cadence changed.
    const values = {
      ...input,
      team_id: user.team_id,
      next_run_at: computeNextRun(
        { ...input, timezone: DEFAULT_TIMEZONE },
        new Date(),
      ),
    };

    try {
      if (schedule_id) {
        await updateReportSchedule(user.team_id, schedule_id, values);
      } else {
        await insertReportSchedule(values);
      }

      revalidate.reports();

      return ResponseFactory.success(
        `${schedule_id ? 'Updated' : 'Added'} report schedule successfully`,
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
    try {
      // Re-enabling recomputes `next_run_at` from now, so a schedule that was
      // paused past its occurrence never fires a backlog of missed runs.
      let next_run_at: Date | undefined;
      if (enabled) {
        const schedule = await getReportSchedule(user.team_id, schedule_id);
        if (schedule) next_run_at = computeNextRun(schedule, new Date());
      }

      await updateReportSchedule(user.team_id, schedule_id, {
        enabled,
        next_run_at,
      });

      revalidate.reports();

      return ResponseFactory.success(
        `Schedule ${enabled ? 'enabled' : 'disabled'} successfully`,
      );
    } catch {
      return ResponseFactory.error('Failed to update schedule');
    }
  },
);

export const removeReportSchedules = reports(
  ['delete'],
  async function remove(user, schedule_ids: Array<string>) {
    try {
      await deleteReportSchedules(user.team_id, schedule_ids);

      revalidate.reports();

      return ResponseFactory.success(
        `Deleted ${schedule_ids.length} schedule(s) successfully`,
      );
    } catch {
      return ResponseFactory.error('Failed to delete schedule(s)');
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
    const schedule = await getReportSchedule(user.team_id, schedule_id);

    if (!schedule) {
      return ResponseFactory.error('Schedule not found');
    }

    const request = requestOrigin(await headers());

    if (!request) {
      return ResponseFactory.error('Unable to determine the request origin');
    }

    const cookieStore = await cookies();

    const result = await executeSchedule({
      schedule,
      scheduled_for: new Date(),
      trigger: ReportTrigger.MANUAL,
      ...request,
      cookies: cookieStore.getAll().map(({ name, value }) => ({ name, value })),
    });

    revalidate.reports();

    return result.outcome === 'sent'
      ? ResponseFactory.success('Report generated successfully')
      : ResponseFactory.error(result.error ?? 'Failed to generate report');
  },
);
